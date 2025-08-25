const request = require('supertest');
const { Readable } = require('stream');

// Provide env before requiring server
global.fetch = jest.fn();
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
process.env.CLIENT_API_KEY = process.env.CLIENT_API_KEY || 'local-dev-key';

const appPromise = (upstreamPort) => {
    // Point server to the fake upstream server
    process.env.UPSTREAM_URL = `http://127.0.0.1:${upstreamPort}/sse`;
    delete require.cache[require.resolve('../server')];
    return require('../server');
};

function startFakeSseServer(chunks, port = 0) {
    const http = require('http');
    const server = http.createServer((req, res) => {
        if (req.url === '/sse') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive'
            });

            let i = 0;
            const iv = setInterval(() => {
                if (i >= chunks.length) {
                    clearInterval(iv);
                    res.end();
                    return;
                }
                res.write(chunks[i]);
                i++;
            }, 5);
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    return new Promise((resolve) => {
        server.listen(port, () => {
            const address = server.address();
            resolve({ server, port: address.port });
        });
    });
}

describe('streaming proxy', () => {
    test('end-to-end forwards JSON events derived from data: payloads', async () => {
        const chunks = [
            'event: message\n',
            'data: {"text":"hello"}\n',
            '\n',
            'data: {"text":"world"}\n',
            '\n'
        ];

        const fake = await startFakeSseServer(chunks, 0);
        const app = appPromise(fake.port);

        // Login with real demo user 'alice' (password: 'password')
        const login = await request(app)
            .post('/auth/login')
            .send({ username: 'alice', password: 'password' })
            .expect(200);
        const token = login.body.token;

        const res = await request(app)
            .post('/api/ai')
            .set('Authorization', `Bearer ${token}`)
            .send({ input: 'stream me', stream: true })
            .expect(200);

        const text = res.text;
        expect(text).toContain('{"event":"message","text":"hello"}');
        expect(text).toContain('{"event":"message","text":"world"}');

        fake.server.close();
    });
});
