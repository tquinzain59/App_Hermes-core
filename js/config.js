/**
 * Configuration globale de l'application cliente Hermès Core
 */
export const APP_CONFIG = {
  APP_NAME: 'Hermès Core',
  VERSION: '1.0.0-rc1',
  DEFAULT_GATEWAY_WS: 'ws://localhost:9229/ws',
  DEFAULT_GATEWAY_HTTP: 'http://localhost:9229',
  SUPERVISOR_HTTP: 'http://localhost:9230',
  ENABLE_SIMULATION_FALLBACK: true, // Simule des réponses réalistes si le conteneur Docker est hors ligne
  SIMULATE_STREAMING_SPEED_MS: 18,
  STORAGE_KEYS: {
    ACTIVE_AGENT: 'hermes_app_active_agent',
    CHAT_HISTORY: 'hermes_app_chat_history_v1',
    CLIENT_PROFILE: 'hermes_app_client_profile',
    OLYMPE_DIRECTIVES: 'hermes_app_olympe_directives'
  }
};
