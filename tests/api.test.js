const request = require('supertest');

// Ensure env vars are present before loading the server
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
process.env.CLIENT_API_KEY = process.env.CLIENT_API_KEY || 'local-dev-key';

// Mock global.fetch used in server.js (Node 18+/24+)
global.fetch = jest.fn();
const fetch = global.fetch;

const app = require('../server');

describe('/api/ai', () => {
    const CLIENT_KEY = process.env.CLIENT_API_KEY || 'local-dev-key';

    beforeEach(() => {
        fetch.mockReset();
    });

    test('rejects when missing client key', async () => {
        const res = await request(app)
            .post('/api/ai')
            .send({ input: 'hello' })
            .expect(401);

        expect(res.body).toHaveProperty('error');
    });

    test('proxies non-stream responses', async () => {
        // Mock upstream response
        fetch.mockResolvedValueOnce({ json: async () => ({ result: 'ok' }) });
        // Option A: use client key
        const resA = await request(app)
            .post('/api/ai')
            .set('x-client-key', CLIENT_KEY)
            .send({ input: 'hello' })
            .expect(200);

        expect(resA.body).toEqual({ result: 'ok' });
        expect(fetch).toHaveBeenCalled();

        // Option B: obtain JWT and use Authorization header
        const login = await request(app)
            .post('/auth/login')
            .send({ username: 'bob', password: 'pass' })
            .expect(200);

        const token = login.body.token;
        fetch.mockResolvedValueOnce({ json: async () => ({ result: 'ok2' }) });

        const resB = await request(app)
            .post('/api/ai')
            .set('Authorization', `Bearer ${token}`)
            .send({ input: 'hello again' })
            .expect(200);

        expect(resB.body).toEqual({ result: 'ok2' });
    });
});
