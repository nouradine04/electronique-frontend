use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{fs, sync::Mutex};
use tauri::{Manager, State};
use zeroize::Zeroize;

struct VaultState(Mutex<Option<Connection>>);

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VaultRecordInput {
    collection: String,
    id: String,
    tenant_id: String,
    shop_id: Option<String>,
    payload: Value,
    updated_at: String,
    deleted_at: Option<String>,
    sync_status: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct VaultRecord {
    collection: String,
    id: String,
    tenant_id: String,
    shop_id: Option<String>,
    payload: Value,
    updated_at: String,
    deleted_at: Option<String>,
    sync_status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct VaultStatus {
    opened: bool,
    pending_changes: i64,
    last_pulled_at: Option<String>,
}

fn initialize_schema(connection: &Connection) -> Result<(), rusqlite::Error> {
    connection.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA cipher_memory_security = ON;
         PRAGMA journal_mode = WAL;
         CREATE TABLE IF NOT EXISTS local_records (
           collection TEXT NOT NULL,
           id TEXT NOT NULL,
           tenant_id TEXT NOT NULL,
           shop_id TEXT,
           payload_json TEXT NOT NULL,
           updated_at TEXT NOT NULL,
           deleted_at TEXT,
           sync_status TEXT NOT NULL DEFAULT 'pending',
           PRIMARY KEY (collection, id)
         );
         CREATE INDEX IF NOT EXISTS idx_local_records_tenant_updated
           ON local_records (tenant_id, updated_at);
         CREATE INDEX IF NOT EXISTS idx_local_records_sync
           ON local_records (tenant_id, sync_status, updated_at);
         CREATE INDEX IF NOT EXISTS idx_local_records_shop_collection
           ON local_records (shop_id, collection);
         CREATE TABLE IF NOT EXISTS local_media (
           id TEXT PRIMARY KEY,
           tenant_id TEXT NOT NULL,
           shop_id TEXT,
           mime_type TEXT NOT NULL,
           bytes BLOB NOT NULL,
           remote_key TEXT,
           updated_at TEXT NOT NULL,
           sync_status TEXT NOT NULL DEFAULT 'pending'
         );
         CREATE TABLE IF NOT EXISTS sync_state (
           tenant_id TEXT PRIMARY KEY,
           last_pulled_at TEXT,
           last_pushed_at TEXT
         );"
    )
}

#[tauri::command]
fn desktop_vault_open(
    app: tauri::AppHandle,
    account: String,
    mut passphrase: String,
    state: State<'_, VaultState>,
) -> Result<(), String> {
    if account.trim().is_empty() || passphrase.len() < 8 {
        passphrase.zeroize();
        return Err("Identifiant ou mot de passe invalide.".into());
    }
    let account_hash = format!("{:x}", Sha256::digest(account.trim().to_lowercase().as_bytes()));
    let directory = app.path().app_data_dir().map_err(|error| error.to_string())?;
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    let path = directory.join(format!("nstock-{account_hash}.db"));
    let connection = Connection::open(path).map_err(|error| error.to_string())?;
    let key_result = connection.pragma_update(None, "key", &passphrase);
    passphrase.zeroize();
    key_result.map_err(|_| "Impossible d’ouvrir la base chiffrée.".to_string())?;
    let cipher_version: String = connection
        .query_row("PRAGMA cipher_version", [], |row| row.get(0))
        .map_err(|_| "SQLCipher n’est pas disponible dans cette version de l’application.".to_string())?;
    if cipher_version.trim().is_empty() {
        return Err("SQLCipher n’est pas actif.".into());
    }
    connection
        .query_row("SELECT count(*) FROM sqlite_master", [], |_row| Ok(()))
        .map_err(|_| "Mot de passe incorrect ou base locale endommagée.".to_string())?;
    initialize_schema(&connection).map_err(|error| error.to_string())?;
    let mut vault = state.0.lock().map_err(|_| "Base locale indisponible.".to_string())?;
    *vault = Some(connection);
    Ok(())
}

#[tauri::command]
fn desktop_vault_close(state: State<'_, VaultState>) -> Result<(), String> {
    let mut vault = state.0.lock().map_err(|_| "Base locale indisponible.".to_string())?;
    *vault = None;
    Ok(())
}

#[tauri::command]
fn desktop_vault_upsert(record: VaultRecordInput, state: State<'_, VaultState>) -> Result<(), String> {
    let vault = state.0.lock().map_err(|_| "Base locale indisponible.".to_string())?;
    let connection = vault.as_ref().ok_or("Ouvrez la base locale avant toute écriture.")?;
    let payload = serde_json::to_string(&record.payload).map_err(|error| error.to_string())?;
    connection.execute(
        "INSERT INTO local_records
         (collection, id, tenant_id, shop_id, payload_json, updated_at, deleted_at, sync_status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(collection, id) DO UPDATE SET
           tenant_id=excluded.tenant_id, shop_id=excluded.shop_id,
           payload_json=excluded.payload_json, updated_at=excluded.updated_at,
           deleted_at=excluded.deleted_at, sync_status=excluded.sync_status",
        params![record.collection, record.id, record.tenant_id, record.shop_id, payload,
                record.updated_at, record.deleted_at, record.sync_status.unwrap_or_else(|| "pending".into())],
    ).map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn desktop_vault_query(
    collection: String,
    tenant_id: String,
    shop_id: Option<String>,
    updated_after: Option<String>,
    limit: Option<u16>,
    state: State<'_, VaultState>,
) -> Result<Vec<VaultRecord>, String> {
    let vault = state.0.lock().map_err(|_| "Base locale indisponible.".to_string())?;
    let connection = vault.as_ref().ok_or("Base locale fermée.")?;
    let mut statement = connection.prepare(
        "SELECT collection, id, tenant_id, shop_id, payload_json, updated_at, deleted_at, sync_status
         FROM local_records
         WHERE collection = ?1 AND tenant_id = ?2
           AND (?3 IS NULL OR shop_id = ?3)
           AND (?4 IS NULL OR updated_at > ?4)
         ORDER BY updated_at ASC LIMIT ?5"
    ).map_err(|error| error.to_string())?;
    let rows = statement.query_map(
        params![collection, tenant_id, shop_id, updated_after, i64::from(limit.unwrap_or(500).clamp(1, 500))],
        |row| {
            let payload: String = row.get(4)?;
            Ok(VaultRecord {
                collection: row.get(0)?, id: row.get(1)?, tenant_id: row.get(2)?, shop_id: row.get(3)?,
                payload: serde_json::from_str(&payload).unwrap_or(Value::Null), updated_at: row.get(5)?,
                deleted_at: row.get(6)?, sync_status: row.get(7)?,
            })
        },
    ).map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
}

#[tauri::command]
fn desktop_vault_snapshot(
    offset: Option<u32>,
    limit: Option<u16>,
    state: State<'_, VaultState>,
) -> Result<Vec<VaultRecord>, String> {
    let vault = state.0.lock().map_err(|_| "Base locale indisponible.".to_string())?;
    let connection = vault.as_ref().ok_or("Base locale fermée.")?;
    let mut statement = connection.prepare(
        "SELECT collection, id, tenant_id, shop_id, payload_json, updated_at, deleted_at, sync_status
         FROM local_records
         ORDER BY collection ASC, id ASC LIMIT ?1 OFFSET ?2"
    ).map_err(|error| error.to_string())?;
    let rows = statement.query_map(
        params![i64::from(limit.unwrap_or(500).clamp(1, 500)), i64::from(offset.unwrap_or(0))],
        |row| {
            let payload: String = row.get(4)?;
            Ok(VaultRecord {
                collection: row.get(0)?, id: row.get(1)?, tenant_id: row.get(2)?, shop_id: row.get(3)?,
                payload: serde_json::from_str(&payload).unwrap_or(Value::Null), updated_at: row.get(5)?,
                deleted_at: row.get(6)?, sync_status: row.get(7)?,
            })
        },
    ).map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
}

#[tauri::command]
fn desktop_vault_status(tenant_id: String, state: State<'_, VaultState>) -> Result<VaultStatus, String> {
    let vault = state.0.lock().map_err(|_| "Base locale indisponible.".to_string())?;
    let Some(connection) = vault.as_ref() else {
        return Ok(VaultStatus { opened: false, pending_changes: 0, last_pulled_at: None });
    };
    let pending_changes = connection.query_row(
        "SELECT count(*) FROM local_records WHERE tenant_id = ?1 AND sync_status != 'synced'",
        [&tenant_id], |row| row.get(0),
    ).map_err(|error| error.to_string())?;
    let last_pulled_at = connection.query_row(
        "SELECT last_pulled_at FROM sync_state WHERE tenant_id = ?1", [&tenant_id], |row| row.get(0),
    ).ok();
    Ok(VaultStatus { opened: true, pending_changes, last_pulled_at })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(VaultState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            desktop_vault_open,
            desktop_vault_close,
            desktop_vault_upsert,
            desktop_vault_query,
            desktop_vault_snapshot,
            desktop_vault_status
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("NStock desktop could not start");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn sqlcipher_encrypts_the_database_file() {
        let stamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let path = std::env::temp_dir().join(format!("nstock-sqlcipher-{}-{stamp}.db", std::process::id()));
        let connection = Connection::open(&path).unwrap();
        connection.pragma_update(None, "key", "test-passphrase-123").unwrap();
        let cipher_version: String = connection.query_row("PRAGMA cipher_version", [], |row| row.get(0)).unwrap();
        assert!(!cipher_version.is_empty());
        initialize_schema(&connection).unwrap();
        drop(connection);

        let bytes = fs::read(&path).unwrap();
        assert_ne!(&bytes[..16], b"SQLite format 3\0");
        let unkeyed = Connection::open(&path).unwrap();
        assert!(unkeyed.query_row("SELECT count(*) FROM sqlite_master", [], |row| row.get::<_, i64>(0)).is_err());
        drop(unkeyed);
        fs::remove_file(path).unwrap();
    }
}
