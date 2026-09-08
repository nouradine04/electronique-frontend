let persistenceRequest;

/**
 * Demande au navigateur de ne pas évincer automatiquement les données locales.
 * Le navigateur reste libre d'accepter ou de refuser. La synchronisation cloud
 * demeure donc la protection définitive contre la perte d'un appareil.
 */
export function ensurePersistentStorage() {
  if (!persistenceRequest) {
    persistenceRequest = (async () => {
      if (!navigator.storage?.persist) {
        return { supported: false, persisted: false };
      }

      const alreadyPersisted = await navigator.storage.persisted?.();
      const persisted = alreadyPersisted || await navigator.storage.persist();
      const estimate = await navigator.storage.estimate?.().catch(() => null);

      return {
        supported: true,
        persisted,
        usage: estimate?.usage ?? null,
        quota: estimate?.quota ?? null,
      };
    })().catch(() => ({ supported: true, persisted: false }));
  }

  return persistenceRequest;
}
