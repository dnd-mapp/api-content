import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tlsConfig } from './tls.config';

describe('tlsConfig', () => {
    const originalDirectory = process.cwd();

    // The default certificate and key are relative to the working directory, so each test runs in an empty one.
    beforeEach(() => {
        process.chdir(mkdtempSync(join(tmpdir(), 'api-content-')));
    });

    afterEach(() => {
        const directory = process.cwd();

        process.chdir(originalDirectory);
        rmSync(directory, { recursive: true });
        vi.unstubAllEnvs();
    });

    describe.each(['', 'development'])('when NODE_ENV is "%s"', (nodeEnv) => {
        beforeEach(() => {
            vi.stubEnv('NODE_ENV', nodeEnv);
        });

        it('reads the certificate and key from .certs by default', () => {
            mkdirSync('.certs');
            writeFileSync('.certs/cert.pem', 'certificate');
            writeFileSync('.certs/key.pem', 'key');

            expect(tlsConfig()).toEqual({ certFile: '.certs/cert.pem', keyFile: '.certs/key.pem' });
        });

        it('reads the certificate and key from TLS_CERT_FILE and TLS_KEY_FILE', () => {
            writeFileSync('cert.pem', 'certificate');
            writeFileSync('key.pem', 'key');
            vi.stubEnv('TLS_CERT_FILE', 'cert.pem');
            vi.stubEnv('TLS_KEY_FILE', 'key.pem');

            expect(tlsConfig()).toEqual({ certFile: 'cert.pem', keyFile: 'key.pem' });
        });

        it('throws when the certificate and key are missing', () => {
            expect(() => tlsConfig()).toThrow('pnpm run setup-https');
        });
    });

    it('returns no certificate and key when NODE_ENV is production', () => {
        vi.stubEnv('NODE_ENV', 'production');

        expect(tlsConfig()).toEqual({ certFile: undefined, keyFile: undefined });
    });

    it('returns no certificate and key when NODE_ENV is test, even when TLS_CERT_FILE and TLS_KEY_FILE are set', () => {
        vi.stubEnv('NODE_ENV', 'test');
        vi.stubEnv('TLS_CERT_FILE', 'missing.pem');
        vi.stubEnv('TLS_KEY_FILE', 'missing.pem');

        expect(tlsConfig()).toEqual({ certFile: undefined, keyFile: undefined });
    });
});
