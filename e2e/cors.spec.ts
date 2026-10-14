import { inject } from 'vitest';

const baseUrl = inject('baseUrl');

// The origin of the dev server of `web-app`, which `.env.example` and `e2e/compose.yaml` put in `CORS_ORIGINS`.
const ALLOWED_ORIGIN = 'https://localhost.www.dndmapp.dev:3100';
const OTHER_ORIGIN = 'https://example.com';

async function get(origin: string) {
    return await fetch(new URL('/health/live', baseUrl), { headers: { origin } });
}

async function preflight(origin: string) {
    return await fetch(new URL('/health/live', baseUrl), {
        method: 'OPTIONS',
        headers: { origin, 'access-control-request-method': 'GET' },
    });
}

/** Returns the header names in the `Vary` header of the response, in lower case. */
function varyOf(response: Response) {
    return (response.headers.get('vary') ?? '').split(',').map((name) => name.trim().toLowerCase());
}

describe('CORS', () => {
    it('lets a page of an allowed origin read the response of GET', async () => {
        const response = await get(ALLOWED_ORIGIN);

        expect(response.status).toBe(200);
        expect(response.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN);
        expect(varyOf(response)).toContain('origin');
    });

    it('answers GET from another origin without allowing it to read the response', async () => {
        const response = await get(OTHER_ORIGIN);

        expect(response.status).toBe(200);
        expect(response.headers.has('access-control-allow-origin')).toBe(false);
        expect(varyOf(response)).toContain('origin');
    });

    it('allows GET and HEAD only in a preflight from an allowed origin', async () => {
        const response = await preflight(ALLOWED_ORIGIN);

        expect(response.status).toBe(204);
        expect(response.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN);
        expect(response.headers.get('access-control-allow-methods')).toBe('GET, HEAD');
    });

    it('allows no other origin in a preflight', async () => {
        const response = await preflight(OTHER_ORIGIN);

        expect(response.headers.has('access-control-allow-origin')).toBe(false);
    });
});
