// Project configuration
// Change DEFAULT_MODEL here to roll out a different model for all clients.
// IMPORTANT: Do NOT expose secret API keys in client-side code for production.
const DEFAULT_MODEL = 'gpt-5-mini';

// Expose a small config object to the app
window.AppConfig = {
    defaultModel: DEFAULT_MODEL
};

// Optional: provide a client key for local development to authenticate with the server.
// In production, this should be replaced with a secure auth flow.
window.AppConfig.clientKey = 'local-dev-key';
// Optional: apiBase can point to a backend (Cloud Run) URL, e.g. https://SERVICE-xxx.a.run.app
window.AppConfig.apiBase = '';
