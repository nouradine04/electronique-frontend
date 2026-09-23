export function prepareLocalUser(users, data) {
  return users.prepareCreate(user => {
    // Watermelon gère l'identifiant séparément des colonnes du schéma.
    const { id, ...fields } = data;
    if (id) user._raw.id = id;
    for (const [field, value] of Object.entries(fields)) user._setRaw(field, value);
    user._setRaw('synced', data.synced === true);
  });
}
