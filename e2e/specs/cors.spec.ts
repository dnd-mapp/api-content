import { get, preflight, varyOf } from '../utils';

// The origin of the dev server of `web-app`, which `.env.example` and `e2e/compose.yaml` put in `CORS_ORIGINS`.
const ALLOWED_ORIGIN = 'https://localhost.www.dndmapp.dev:3100';
const OTHER_ORIGIN = 'https://example.com';
const PATH = '/health/live';

describe('CORS', () => {
    it('lets a page of an allowed origin read the response of GET', async () => {
        const response = await get(PATH, { headers: { origin: ALLOWED_ORIGIN } });

        expect(response.status).toBe(200);
        expect(response.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN);
        expect(varyOf(response)).toContain('origin');
    });

    it('answers GET from another origin without allowing it to read the response', async () => {
        const response = await get(PATH, { headers: { origin: OTHER_ORIGIN } });

        expect(response.status).toBe(200);
        expect(response.headers.has('access-control-allow-origin')).toBe(false);
        expect(varyOf(response)).toContain('origin');
    });

    it('allows GET and HEAD only in a preflight from an allowed origin', async () => {
        const response = await preflight(PATH, ALLOWED_ORIGIN);

        expect(response.status).toBe(204);
        expect(response.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN);
        expect(response.headers.get('access-control-allow-methods')).toBe('GET, HEAD');
    });

    it('allows no other origin in a preflight', async () => {
        const response = await preflight(PATH, OTHER_ORIGIN);

        expect(response.headers.has('access-control-allow-origin')).toBe(false);
    });
});
