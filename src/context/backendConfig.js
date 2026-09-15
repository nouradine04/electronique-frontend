// URL centrale du backend NestJS
// Changez cette valeur selon votre environnement
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// Le développement reste local par défaut. La production active explicitement
// la synchronisation après configuration du backend et de PostgreSQL.
export const LOCAL_ONLY = import.meta.env.VITE_ENABLE_CLOUD_SYNC !== 'true';
