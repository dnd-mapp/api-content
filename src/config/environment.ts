import { z } from 'zod';

// Fastify only listens on localhost by default, which a container cannot be reached on.
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 3000;
// The ports below 1024 are privileged, and binding one takes root or an extra capability that the server should not
// need.
const MIN_PORT = 1024;
const MAX_PORT = 65535;

// Zod's `default()` only covers a variable that is unset, so an empty one is treated as unset first.
const emptyAsUnset = (value: unknown) => (value === '' ? undefined : value);

const host = z.union([z.ipv4(), z.ipv6(), z.hostname()], {
    error: (issue) => `must be a hostname or an IP address, but is "${String(issue.input)}".`,
});

const portError = (issue: { input?: unknown }) =>
    `must be a whole number from ${MIN_PORT} to ${MAX_PORT}, but is "${String(issue.input)}".`;

// The digits come first, because `Number` also converts a hexadecimal, a fraction, and padding with whitespace.
const port = z
    .string()
    .regex(/^\d+$/, { error: portError })
    .transform(Number)
    .pipe(z.number().min(MIN_PORT, { error: portError }).max(MAX_PORT, { error: portError }));

/**
 * The schema of the environment variables that the application reads, which validates them and converts them to their
 * types. An invalid value fails the validation, so the application fails to start rather than run with a broken
 * configuration.
 */
export const environmentSchema = z.object({
    /** The hostname or IP address that the server listens on. */
    HOST: z.preprocess(emptyAsUnset, host.default(DEFAULT_HOST)),
    /** The port that the server listens on. */
    PORT: z.preprocess(emptyAsUnset, port.default(DEFAULT_PORT)),
});

/** The environment variables that the application reads, once validated. */
export type Environment = z.infer<typeof environmentSchema>;
