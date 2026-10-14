import { defineConfig } from 'vitest/config';

const isCI = Boolean(process.env['CI']);

// Runs the end-to-end suite against a live server, with `pnpm run e2e` or `pnpm run e2e-ci`. It measures no coverage, since the server
// runs in another process.
export default defineConfig({
    test: {
        environment: 'node',
        // Trusts the CA of mkcert, which `mkcert -install` adds to the trust store of the system, so the specs can
        // request the dev server.
        execArgv: ['--use-system-ca'],
        globals: true,
        globalSetup: ['e2e/global-setup.ts'],
        include: ['e2e/specs/**/*.spec.ts'],
        name: 'api-content-e2e',
        reporters: ['default', ...(isCI ? ['github-actions'] : [])],
    },
});
