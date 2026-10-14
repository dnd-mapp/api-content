import { get } from '../utils';

describe('Health endpoints', () => {
    it('GET /health/live answers 200 with the health check result', async () => {
        const response = await get('/health/live');

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ status: 'ok', info: {}, error: {}, details: {} });
    });

    it('GET /health/ready answers 200 with the health check result', async () => {
        const response = await get('/health/ready');

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ status: 'ok', info: {}, error: {}, details: {} });
    });

    it.each(['/health/live', '/health/ready'])('tells caches to never store the result of GET %s', async (path) => {
        const response = await get(path);

        expect(response.headers.get('cache-control')).toContain('no-cache');
    });

    it('serves nothing else', async () => {
        const response = await get('/');

        expect(response.status).toBe(404);
    });
});
