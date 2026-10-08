import { environmentSchema } from './environment';

/** Returns the path and message of each issue that the schema reports for the environment. */
function issuesOf(environment: Record<string, string>) {
    return environmentSchema.safeParse(environment).error?.issues.map(({ path, message }) => ({ path, message }));
}

describe('environmentSchema', () => {
    it('reports every invalid variable together, each under its name', () => {
        const issues = environmentSchema.safeParse({ HOST: 'local host', PORT: '80', NODE_ENV: 'test' }).error?.issues;

        expect(issues?.map(({ path }) => path)).toEqual([['HOST'], ['PORT']]);
    });

    it.each(['prod', 'Development', 'staging'])('rejects "%s" as NODE_ENV', (nodeEnv) => {
        expect(issuesOf({ NODE_ENV: nodeEnv })).toEqual([
            { path: ['NODE_ENV'], message: `must be development, production, or test, but is "${nodeEnv}".` },
        ]);
    });

    describe.each([
        ['unset', {}],
        ['empty', { NODE_ENV: '' }],
        ['development', { NODE_ENV: 'development' }],
    ])('when NODE_ENV is %s', (_, nodeEnv) => {
        it('leaves reading the certificate and key to the factory of the tls namespace', () => {
            expect(issuesOf({ ...nodeEnv, TLS_CERT_FILE: 'missing.pem', TLS_KEY_FILE: 'missing.pem' })).toBeUndefined();
        });
    });

    describe('when NODE_ENV is test', () => {
        it('ignores TLS_CERT_FILE and TLS_KEY_FILE, so the specs need no certificate', () => {
            expect(
                issuesOf({ NODE_ENV: 'test', TLS_CERT_FILE: 'missing.pem', TLS_KEY_FILE: 'missing.pem' }),
            ).toBeUndefined();
        });
    });

    describe('when NODE_ENV is production', () => {
        it('accepts unset TLS variables', () => {
            expect(issuesOf({ NODE_ENV: 'production' })).toBeUndefined();
        });

        it('rejects TLS_CERT_FILE and TLS_KEY_FILE, since the image serves HTTP only', () => {
            expect(issuesOf({ NODE_ENV: 'production', TLS_CERT_FILE: 'cert.pem', TLS_KEY_FILE: 'key.pem' })).toEqual([
                {
                    path: ['TLS_CERT_FILE'],
                    message:
                        'must be unset when NODE_ENV is production, since the image serves HTTP only, but is "cert.pem".',
                },
                {
                    path: ['TLS_KEY_FILE'],
                    message:
                        'must be unset when NODE_ENV is production, since the image serves HTTP only, but is "key.pem".',
                },
            ]);
        });
    });
});
