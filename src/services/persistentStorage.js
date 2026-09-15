let persistenceRequest;

/**
 * Tente silencieusement d'empêcher l'éviction automatique des données locales.
 * Safari et les navigateurs Chromium décident eux-mêmes, sans formulaire dans
 * l'application. Un refus n'est pas mémorisé afin de réessayer après connexion
 * ou lors du prochain lancement de l'application installée.
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
    })()
      .catch(() => ({ supported: true, persisted: false }))
      .then(result => {
        if (!result.persisted) persistenceRequest = undefined;
        return result;
      });
  }

  return persistenceRequest;
}
