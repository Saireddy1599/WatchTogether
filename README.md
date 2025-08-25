# WatchTogether (Local)

A simple local setup for the WatchTogether demo with a small server-side AI proxy.

## What I added
- `config.js` — client config with `DEFAULT_MODEL = 'gpt-5-mini'`.
- `assistant` UI modal in `index.html`.
- `server.js` — minimal Express proxy for OpenAI `/api/ai`.
- `package.json` with start/dev scripts.

## Prerequisites
- Node.js (v16+ recommended)
- An OpenAI API key set in a `.env` file at the project root:

```
OPENAI_API_KEY=sk-....
DEFAULT_MODEL=gpt-5-mini
```

## Run locally (PowerShell)
```powershell
cd 'C:\Users\Sai Kiran\Downloads\watchtogether-pro'
npm install
npm start
# Open http://localhost:3001 in your browser
```

The static site is served by the Express server at port 3001 by default. The assistant endpoint is at `/api/ai`.

## How to test the assistant UI
- Click the floating 🤖 button in the bottom-right.
- Type a prompt and press Send.
- The client will POST to `/api/ai` and show the response text.

### Client authentication
The server requires a client key. Set `CLIENT_API_KEY` in your `.env` and the client will send it automatically via the `x-client-key` header.

### Streaming responses
The client supports streaming responses. When sending `{ stream: true }` the server will proxy the upstream streaming body and forward chunks as `text/event-stream`.

## Security
- Do NOT commit your `.env` with `OPENAI_API_KEY` to source control.
- For production, move the API key to a secrets manager and enforce server-side auth and rate limits.

## Next steps (optional)
- Add server-side auth to restrict API proxy.
- Add streaming responses for better UX.
- Add unit tests for server endpoint.
