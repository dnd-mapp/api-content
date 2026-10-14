import { corsConfig, corsSchema } from './cors.config';

/** Returns the path and message of each issue that the schema reports for the environment. */
function issuesOf(environment: Record<string, string>) {
    return corsSchema.safeParse(environment).error?.issues.map(({ path, message }) => ({ path, message }));
}

/** Returns the message that the schema reports for an entry of CORS_ORIGINS that is not an origin. */
function invalid(entry: string) {
    return `must be a comma-separated list of origins, each "https://", a host, and an optional port, but holds "${entry}".`;
}

describe('corsSchema', () => {
    it.each(['https://www.dndmapp.nl.eu.org', 'https://localhost.www.dndmapp.dev:3100', 'https://[::1]:3100'])(
        'accepts "%s" as CORS_ORIGINS',
        (origin) => {
            expect(issuesOf({ CORS_ORIGINS: origin })).toBeUndefined();
        },
    );

    // `ConfigModule` copies only strings, numbers, and booleans from the validated `.env` files into `process.env`.
    it('keeps CORS_ORIGINS a string, so ConfigModule copies it from a .env file', () => {
        const list = ' https://www.dndmapp.nl.eu.org , https://localhost.www.dndmapp.dev:3100 ';

        expect(corsSchema.parse({ CORS_ORIGINS: list }).CORS_ORIGINS).toBe(list);
    });

    it.each([
        'http://www.dndmapp.nl.eu.org',
        'https://www.dndmapp.nl.eu.org/content',
        'https://www.dndmapp.nl.eu.org/',
        'https://www.dndmapp.nl.eu.org?page=1',
        'https://WWW.dndmapp.nl.eu.org',
        'https://www.dndmapp.nl.eu.org:443',
        'https://*.dndmapp.nl.eu.org',
        '*',
        'www.dndmapp.nl.eu.org',
    ])('rejects "%s" as an origin, and names it', (entry) => {
        expect(issuesOf({ CORS_ORIGINS: entry })).toEqual([{ path: ['CORS_ORIGINS'], message: invalid(entry) }]);
    });

    it('reports every invalid origin of the list', () => {
        expect(issuesOf({ CORS_ORIGINS: 'http://localhost:3100, https://www.dndmapp.nl.eu.org, *,' })).toEqual([
            { path: ['CORS_ORIGINS'], message: invalid('http://localhost:3100') },
            { path: ['CORS_ORIGINS'], message: invalid('*') },
            { path: ['CORS_ORIGINS'], message: invalid('') },
        ]);
    });
});

describe('corsConfig', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('allows no origins when CORS_ORIGINS is unset', () => {
        vi.stubEnv('CORS_ORIGINS', undefined);

        expect(corsConfig()).toEqual({ origins: [] });
    });

    it('allows no origins when CORS_ORIGINS is empty', () => {
        vi.stubEnv('CORS_ORIGINS', '');

        expect(corsConfig()).toEqual({ origins: [] });
    });

    it('reads the origins from CORS_ORIGINS, without the spaces around each one', () => {
        vi.stubEnv('CORS_ORIGINS', ' https://www.dndmapp.nl.eu.org , https://localhost.www.dndmapp.dev:3100 ');

        expect(corsConfig()).toEqual({
            origins: ['https://www.dndmapp.nl.eu.org', 'https://localhost.www.dndmapp.dev:3100'],
        });
    });
});
