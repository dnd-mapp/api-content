import { givenFile } from '@/testing';
import { tlsConfig } from './tls.config';

vi.mock('node:fs');

/** Returns the message that the factory reports for a file that cannot be read. */
function unreadable(path: string) {
    return `must be a readable file, but "${path}" is missing or cannot be read. Run "pnpm run setup-https" to create it.`;
}

describe('tlsConfig', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe.each(['', 'development'])('when NODE_ENV is "%s"', (nodeEnv) => {
        beforeEach(() => {
            vi.stubEnv('NODE_ENV', nodeEnv);
        });

        it('reads the certificate and key from .certs by default', () => {
            givenFile('.certs/cert.pem', 'certificate');
            givenFile('.certs/key.pem', 'key');

            expect(tlsConfig()).toEqual({ cert: Buffer.from('certificate'), key: Buffer.from('key') });
        });

        it('reads the certificate and key from TLS_CERT_FILE and TLS_KEY_FILE', () => {
            givenFile('cert.pem', 'certificate');
            givenFile('key.pem', 'key');
            vi.stubEnv('TLS_CERT_FILE', 'cert.pem');
            vi.stubEnv('TLS_KEY_FILE', 'key.pem');

            expect(tlsConfig()).toEqual({ cert: Buffer.from('certificate'), key: Buffer.from('key') });
        });

        it('reports the certificate and key together when neither can be read', () => {
            expect(() => tlsConfig()).toThrow(
                new Error(
                    [
                        'Config validation error:',
                        `✖ ${unreadable('.certs/cert.pem')}`,
                        '  → at TLS_CERT_FILE',
                        `✖ ${unreadable('.certs/key.pem')}`,
                        '  → at TLS_KEY_FILE',
                    ].join('\n'),
                ),
            );
        });

        it('reports only the file that cannot be read', () => {
            givenFile('.certs/key.pem', 'key');

            expect(() => tlsConfig()).toThrow(
                new Error(
                    ['Config validation error:', `✖ ${unreadable('.certs/cert.pem')}`, '  → at TLS_CERT_FILE'].join(
                        '\n',
                    ),
                ),
            );
        });
    });

    it('returns no certificate and key when NODE_ENV is production', () => {
        vi.stubEnv('NODE_ENV', 'production');

        expect(tlsConfig()).toEqual({ cert: undefined, key: undefined });
    });

    it('rejects TLS_CERT_FILE when NODE_ENV is production', () => {
        givenFile('cert.pem', 'certificate');
        vi.stubEnv('NODE_ENV', 'production');
        vi.stubEnv('TLS_CERT_FILE', 'cert.pem');

        expect(() => tlsConfig()).toThrow('must be unset when NODE_ENV is production');
    });

    it('returns no certificate and key when NODE_ENV is test, even when TLS_CERT_FILE and TLS_KEY_FILE are set', () => {
        vi.stubEnv('NODE_ENV', 'test');
        vi.stubEnv('TLS_CERT_FILE', 'missing.pem');
        vi.stubEnv('TLS_KEY_FILE', 'missing.pem');

        expect(tlsConfig()).toEqual({ cert: undefined, key: undefined });
    });
});
