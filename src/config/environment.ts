/** The environment variables that the application reads, once validated. */
export interface Environment {
    /** The port that the server listens on. */
    PORT: number;
}

const DEFAULT_PORT = 3000;
// The ports below 1024 are privileged, and binding one takes root or an extra capability that the server should not
// need.
const MIN_PORT = 1024;
const MAX_PORT = 65535;

/**
 * Validates the environment variables that the application reads, and converts them to their types. It throws on an
 * invalid value, so the application fails to start rather than run with a broken configuration.
 */
export function validateEnvironment(config: Record<string, string | undefined>): Environment {
    return {
        PORT: parsePort(config['PORT']),
    };
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
