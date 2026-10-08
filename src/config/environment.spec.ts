import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { environmentSchema } from './environment';

/** Returns the path and message of each issue that the schema reports for the environment. */
function issuesOf(environment: Record<string, string>) {
    return environmentSchema.safeParse(environment).error?.issues.map(({ path, message }) => ({ path, message }));
}

describe('environmentSchema', () => {
    const originalDirectory = process.cwd();

    // The default certificate and key are relative to the working directory, so each test runs in an empty one.
    beforeEach(() => {
        process.chdir(mkdtempSync(join(tmpdir(), 'api-content-')));
    });

    afterEach(() => {
        const directory = process.cwd();

        process.chdir(originalDirectory);
        rmSync(directory, { recursive: true });
    });

    it('reports every invalid variable together, each under its name', () => {
        const issues = environmentSchema.safeParse({ HOST: 'local host', PORT: '80', NODE_ENV: 'test' }).error?.issues;

        expect(issues?.map(({ path }) => path)).toEqual([['HOST'], ['PORT']]);
    });

    it('reports a missing certificate and key together with the other invalid variables', () => {
        const issues = environmentSchema.safeParse({ HOST: 'local host', NODE_ENV: 'development' }).error?.issues;

        expect(issues?.map(({ path }) => path)).toEqual([['HOST'], ['TLS_CERT_FILE'], ['TLS_KEY_FILE']]);
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
        it('reports the default certificate and key together when .certs does not hold them', () => {
            expect(issuesOf(nodeEnv)).toEqual([
                {
                    path: ['TLS_CERT_FILE'],
                    message: `must be a readable file, but ".certs/cert.pem" is missing or cannot be read. Run "pnpm run setup-https" to create it.`,
                },
                {
                    path: ['TLS_KEY_FILE'],
                    message: `must be a readable file, but ".certs/key.pem" is missing or cannot be read. Run "pnpm run setup-https" to create it.`,
                },
            ]);
        });

        it('accepts the default certificate and key when .certs holds them', () => {
            mkdirSync('.certs');
            writeFileSync('.certs/cert.pem', 'certificate');
            writeFileSync('.certs/key.pem', 'key');

            expect(issuesOf(nodeEnv)).toBeUndefined();
        });

        it('accepts a certificate and key elsewhere through TLS_CERT_FILE and TLS_KEY_FILE', () => {
            writeFileSync('cert.pem', 'certificate');
            writeFileSync('key.pem', 'key');

            expect(issuesOf({ ...nodeEnv, TLS_CERT_FILE: 'cert.pem', TLS_KEY_FILE: 'key.pem' })).toBeUndefined();
        });

        it('rejects a directory as TLS_CERT_FILE', () => {
            mkdirSync('cert.pem');
            writeFileSync('key.pem', 'key');

            expect(issuesOf({ ...nodeEnv, TLS_CERT_FILE: 'cert.pem', TLS_KEY_FILE: 'key.pem' })).toEqual([
                {
                    path: ['TLS_CERT_FILE'],
                    message: `must be a readable file, but "cert.pem" is missing or cannot be read. Run "pnpm run setup-https" to create it.`,
                },
            ]);
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
            writeFileSync('cert.pem', 'certificate');
            writeFileSync('key.pem', 'key');

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
