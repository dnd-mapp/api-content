import { isIP } from 'node:net';

/** The environment variables that the application reads, once validated. */
export interface Environment {
    /** The hostname or IP address that the server listens on. */
    HOST: string;
    /** The port that the server listens on. */
    PORT: number;
}

// Fastify only listens on localhost by default, which a container cannot be reached on.
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 3000;
// The ports below 1024 are privileged, and binding one takes root or an extra capability that the server should not
// need.
const MIN_PORT = 1024;
const MAX_PORT = 65535;

// One or more labels of letters, digits, and inner hyphens, joined by dots, as RFC 1123 allows in a hostname.
const HOSTNAME_PATTERN = /^(?=.{1,253}$)[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)*$/i;

/**
 * Validates the environment variables that the application reads, and converts them to their types. It throws on an
 * invalid value, so the application fails to start rather than run with a broken configuration.
 */
export function validateEnvironment(config: Record<string, string | undefined>): Environment {
    return {
        HOST: parseHost(config['HOST']),
        PORT: parsePort(config['PORT']),
    };
}

function parseHost(value: string | undefined) {
    if (value === undefined || value === '') {
        return DEFAULT_HOST;
    }
    if (isIP(value) === 0 && !HOSTNAME_PATTERN.test(value)) {
        throw new Error(`HOST must be a hostname or an IP address, but is "${value}".`);
    }
    return value;
}

function parsePort(value: string | undefined) {
    if (value === undefined || value === '') {
        return DEFAULT_PORT;
    }
    const port = /^\d+$/.test(value) ? Number(value) : Number.NaN;

    if (!(port >= MIN_PORT && port <= MAX_PORT)) {
        throw new Error(`PORT must be a whole number from ${MIN_PORT} to ${MAX_PORT}, but is "${value}".`);
    }
    return port;
}
