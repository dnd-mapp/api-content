import { getCACertificates, setDefaultCACertificates } from 'node:tls';
import type { TestProject } from 'vitest/node';
import { answers, startDevServer } from './dev-server';

// The dev server of `pnpm run start`, as `docs/local-https.md` sets it up.
const DEFAULT_BASE_URL = 'https://localhost.content.dndmapp.dev:3000';

declare module 'vitest' {
    export interface ProvidedContext {
        /** The URL of the server that the specs request. */
        baseUrl: string;
    }
}

/**
 * Provides the base URL of the server to the specs. It uses the server at `E2E_BASE_URL` when it is live, so a dev
 * server in watch mode keeps running between runs. Otherwise it starts the dev server, and returns the teardown that
 * stops it after the run.
 */
export default async function setup(project: TestProject) {
    const { E2E_BASE_URL } = process.env;
    // An empty variable counts as unset, as it does for the variables of the server.
    const baseUrl = E2E_BASE_URL === undefined || E2E_BASE_URL === '' ? DEFAULT_BASE_URL : E2E_BASE_URL;

    // The global setup runs in the main process of Vitest, which the `execArgv` of the config does not reach, so it
    // trusts the trust store of the system here, the way `--use-system-ca` does.
    setDefaultCACertificates([...getCACertificates('default'), ...getCACertificates('system')]);
    project.provide('baseUrl', baseUrl);

    if (await answers(baseUrl, '/health/live')) {
        return undefined;
    }
    const server = await startDevServer(baseUrl);

    return async () => await server.stop();
}
