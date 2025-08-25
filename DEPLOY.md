# Deploying backend to Cloud Run

This project includes a GitHub Actions workflow that builds a Docker image and deploys it to Cloud Run.

Required GitHub secrets:
- GCP_PROJECT_ID — your GCP project id
- GCP_SA_KEY — service account JSON (base64 or raw JSON)
- GCP_REGION — Cloud Run region (e.g. us-central1)
- VERTEX_MODEL — Vertex AI model resource name (for example `projects/PROJECT/locations/us-central1/publishers/google/models/text-bison@001`)
- JWT_SECRET — server JWT signing secret
- CLIENT_API_KEY — client dev key for local testing

Optional:
- OPENAI_API_KEY — only if you want to use OpenAI fallback

How it works:
1. Push to `master`.
2. The workflow builds and pushes a container to GCR and deploys to Cloud Run.
3. Cloud Run service will have environment variables `VERTEX_MODEL`, `JWT_SECRET`, and `CLIENT_API_KEY` set.

After deploy:
- The deployed Cloud Run URL will serve the backend API on `/api/ai`.
- You can update the client to call Cloud Run directly or set up a Firebase Hosting rewrite to proxy `/api/**` to Cloud Run.

Hosting rewrite (recommended for same-origin):
Add the following rewrite to `firebase.json` (already patched in this repo):

```json
{
  "hosting": {
    "rewrites": [
      { "source": "/api/**", "run": { "serviceId": "watchtogether-backend", "region": "us-central1" } },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

Smoke tests
- Playwright headless smoke test template: `tests/smoke.signin.spec.js`.
- Assistant smoke POST example:

```powershell
$body = @{ model='gpt-5-mini'; input='Hello from smoke test' } | ConvertTo-Json
Invoke-RestMethod -Uri 'https://watchtogether-48c1e.web.app/api/ai' -Method Post -Body $body -ContentType 'application/json' -Headers @{ 'x-client-key' = 'local-dev-key' }
```

Notes:
- The Playwright test is a template because Google OAuth popups require interactive handling or a service-account-backed flow.
