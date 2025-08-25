// Testing deployment workflow
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const users = require('./users');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VERTEX_MODEL = process.env.VERTEX_MODEL; // e.g. projects/PROJECT/locations/LOCATION/publishers/google/models/text-bison@001
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

// Vertex auth helper
let googleAuthClient = null;
async function getVertexAccessToken() {
    if (!googleAuthClient) {
        const { GoogleAuth } = require('google-auth-library');
        googleAuthClient = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    }
    const client = await googleAuthClient.getClient();
    const token = await client.getAccessToken();
    return token.token || token;
}
const CLIENT_API_KEY = process.env.CLIENT_API_KEY || 'local-dev-key';

// Initialize Firebase Admin if service account provided via env
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({ credential: admin.credential.cert(svc) });
        console.log('Firebase Admin initialized from env service account');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp();
        console.log('Firebase Admin initialized from GOOGLE_APPLICATION_CREDENTIALS');
    }
} catch (e) {
    console.warn('Firebase Admin init failed:', e.message);
}

if (!VERTEX_MODEL || !GCP_PROJECT_ID) {
    console.warn('Warning: VERTEX_MODEL or GCP_PROJECT_ID not set. Configure these to use Vertex AI.');
}

// Enforce request size limits to avoid overly large payloads
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '/')));

// Simple rate limiter: 30 requests per minute per IP for /api/ai
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
});

// Simple client-key auth middleware for /api/ai
// Middleware: accept either a valid x-client-key OR a valid Bearer JWT
async function requireClientKeyOrJwt(req, res, next) {
    const key = req.headers['x-client-key'] || req.query.client_key;
    if (key && key === CLIENT_API_KEY) {
        return next();
    }

    const auth = req.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) {
        const token = auth.slice(7);

        // If Firebase Admin is initialized, try verifying as Firebase ID token
        if (admin.apps && admin.apps.length > 0) {
            try {
                const decoded = await admin.auth().verifyIdToken(token);
                req.user = decoded;
                return next();
            } catch (e) {
                // Not a Firebase token or verification failed — fallthrough to JWT
            }
        }

        // Fallback: verify as local JWT
        try {
            const secret = process.env.JWT_SECRET || 'dev-jwt-secret';
            const payload = jwt.verify(token, secret);
            req.user = payload;
            return next();
        } catch (e) {
            return res.status(401).json({ error: 'Unauthorized: invalid token' });
        }
    }

    return res.status(401).json({ error: 'Unauthorized: invalid client key or token' });
}

// POST /api/ai
// If request includes { stream: true } the server will proxy the upstream streaming response
app.post('/api/ai', requireClientKeyOrJwt, aiLimiter, async (req, res) => {
    const body = req.body || {};
    const model = body.model || process.env.DEFAULT_MODEL || 'gpt-5-mini';
    const input = body.input || '';
    const stream = body.stream === true;

    // If VERTEX_MODEL and GCP credentials are present, use Vertex AI (non-streaming)
    if (VERTEX_MODEL && GCP_PROJECT_ID) {
        try {
            const accessToken = await getVertexAccessToken();
            const vertexUrl = `https://us-central1-aiplatform.googleapis.com/v1/${VERTEX_MODEL}:predict`;
            const resp = await fetch(vertexUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    instances: [{ content: input }],
                    parameters: { temperature: 0.2 }
                })
            });

            const json = await resp.json();
            // Vertex returns predictions/outputs in different shapes; return the raw JSON to the client
            return res.json(json);
        } catch (err) {
            console.error('Vertex AI error', err);
            return res.status(500).json({ error: 'Vertex AI request failed', detail: String(err) });
        }
    }

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server.' });
    }

    try {
        const upstreamUrl = process.env.UPSTREAM_URL || 'https://api.openai.com/v1/responses';
        const upstream = await fetch(upstreamUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(stream ? { model, input, stream: true } : { model, input })
        });

        if (stream) {
            // Proxy streaming response as text/event-stream, but parse SSE and only emit 'data:' lines
            res.setHeader('Content-Type', 'text/event-stream;charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Helper to process incoming text for SSE 'data:' lines and extract clean text
            const processChunk = (chunk, state) => {
                state.buffer += chunk;
                const lines = state.buffer.split(/\r?\n/);
                state.buffer = lines.pop();
                for (const line of lines) {
                    const m = line.match(/^data:\s?(.*)/);
                    if (m) {
                        const payload = m[1];
                        // Try to parse JSON and extract text content
                        let text = '';
                        try {
                            const parsed = JSON.parse(payload);
                            // Heuristics to extract text from various shapes
                            if (parsed.delta) {
                                if (typeof parsed.delta === 'string') text = parsed.delta;
                                else if (parsed.delta.content) text = parsed.delta.content;
                                else if (parsed.delta?.text) text = parsed.delta.text;
                            } else if (parsed.output && Array.isArray(parsed.output)) {
                                // collect text from output entries
                                text = parsed.output.map(o => {
                                    if (typeof o === 'string') return o;
                                    if (o.content) {
                                        if (Array.isArray(o.content)) {
                                            return o.content.map(c => c.text || c).join('');
                                        }
                                        return o.content.text || '';
                                    }
                                    return '';
                                }).join('');
                            } else if (parsed.choices && Array.isArray(parsed.choices)) {
                                text = parsed.choices.map(ch => ch.delta?.content || ch.message?.content || '').join('');
                            } else if (parsed.text) {
                                text = parsed.text;
                            } else {
                                // fallback to raw payload string
                                text = String(parsed || '');
                            }
                        } catch (e) {
                            // Not JSON — use raw payload
                            text = payload;
                        }

                        if (text && text.trim()) {
                            const payloadObj = { event: 'message', text };
                            try { res.write(`data: ${JSON.stringify(payloadObj)}\n\n`); } catch (e) {}
                        }
                    }
                }
            };

            const state = { buffer: '' };

            // If upstream.body supports getReader (WHATWG ReadableStream)
            if (upstream.body && typeof upstream.body.getReader === 'function') {
                const reader = upstream.body.getReader();
                const decoder = new TextDecoder();

                (async () => {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            const chunk = decoder.decode(value, { stream: true });
                            processChunk(chunk, state);
                        }
                    } catch (err) {
                        console.error('Stream forward error', err);
                    } finally {
                        try { res.end(); } catch (e) {}
                    }
                })();
            } else if (upstream.body && typeof upstream.body.on === 'function') {
                // Node.js Readable stream
                upstream.body.on('data', (chunk) => {
                    const text = chunk instanceof Buffer ? chunk.toString('utf8') : String(chunk);
                    processChunk(text, state);
                });
                upstream.body.on('end', () => {
                    try { res.end(); } catch (e) {}
                });
                upstream.body.on('error', (err) => {
                    console.error('Upstream stream error', err);
                    try { res.end(); } catch (e) {}
                });
            } else {
                // Unknown body type: fallback to text and send whole
                const txt = await upstream.text();
                processChunk(txt, state);
                try { res.end(); } catch (e) {}
            }
        } else {
            const data = await upstream.json();
            return res.json(data);
        }
    } catch (err) {
        console.error('AI proxy error', err);
        return res.status(500).json({ error: err.message });
    }
});

// SSE stream endpoint: non-incremental Vertex AI response wrapped as a single SSE message
app.post('/api/ai/stream', requireClientKeyOrJwt, aiLimiter, async (req, res) => {
    const body = req.body || {};
    const input = body.input || '';

    if (!VERTEX_MODEL || !GCP_PROJECT_ID) {
        return res.status(500).json({ error: 'VERTEX_MODEL or GCP_PROJECT_ID not configured' });
    }

    try {
        const accessToken = await getVertexAccessToken();
        const vertexUrl = `https://us-central1-aiplatform.googleapis.com/v1/${VERTEX_MODEL}:predict`;
        const resp = await fetch(vertexUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ instances: [{ content: input }], parameters: { temperature: 0.2 } })
        });

        const json = await resp.json();

        res.setHeader('Content-Type', 'text/event-stream;charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const text = JSON.stringify(json);
        res.write(`data: ${JSON.stringify({ event: 'message', text })}\n\n`);
        res.end();
    } catch (err) {
        console.error('Vertex stream error', err);
        return res.status(500).json({ error: 'Vertex stream failed', detail: String(err) });
    }
});

// Simple auth route: exchange username/password for a JWT (demo only)
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    // Verify against simple user store
    const ok = users.verifyPassword(username, password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { sub: username, role: 'user' };
    const secret = process.env.JWT_SECRET || 'dev-jwt-secret';
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    return res.json({ token });
});

// Exchange Firebase ID token for server JWT
app.post('/auth/firebase-login', async (req, res) => {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: 'idToken required' });

    // Verify Firebase ID token if admin initialized
    if (!admin.apps || admin.apps.length === 0) {
        return res.status(500).json({ error: 'Firebase Admin not configured on server' });
    }

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        const payload = { sub: decoded.uid, firebase: { email: decoded.email } };
        const secret = process.env.JWT_SECRET || 'dev-jwt-secret';
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });
        return res.json({ token });
    } catch (e) {
        return res.status(401).json({ error: 'Invalid Firebase ID token' });
    }
});

// Basic health, readiness and metrics endpoints for monitoring
let healthy = true;
app.get('/health', (req, res) => {
    return res.json({ status: 'ok' });
});

app.get('/ready', (req, res) => {
    if (healthy) return res.json({ ready: true });
    return res.status(503).json({ ready: false });
});

// Simple metrics endpoint (numbers are illustrative)
app.get('/metrics', (req, res) => {
    const uptime = process.uptime();
    const mem = process.memoryUsage();
    const metrics = {
        uptime_seconds: Math.floor(uptime),
        rss_bytes: mem.rss,
        heap_total_bytes: mem.heapTotal,
        heap_used_bytes: mem.heapUsed
    };
    res.json(metrics);
});

// Graceful shutdown support for Cloud Run / containers
function shutdown() {
    if (!healthy) return;
    healthy = false;
    console.log('Shutting down gracefully...');
    // allow in-flight requests to complete then exit
    setTimeout(() => process.exit(0), 5000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Export app for testing, and start server when run directly
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

module.exports = app;
