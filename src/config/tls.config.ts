import { registerAs } from '@nestjs/config';
import { accessSync, constants, statSync } from 'node:fs';
import { z } from 'zod';
import { emptyAsUnset } from './empty-as-unset';

// The files that `pnpm run setup-https` writes, relative to the working directory.
const DEFAULT_CERT_FILE = '.certs/cert.pem';
const DEFAULT_KEY_FILE = '.certs/key.pem';

const nodeEnv = z.enum(['development', 'production', 'test'], {
    error: (issue) => `must be development, production, or test, but is "${String(issue.input)}".`,
});

/** The schema of the environment variables of the `tls` namespace, which validates them one by one. */
export const tlsSchema = z.object({
    /** The environment that the server runs in, which decides how it treats the TLS variables. */
    NODE_ENV: z.preprocess(emptyAsUnset, nodeEnv.optional()),
    /** The path of the certificate that the server serves HTTPS with. */
    TLS_CERT_FILE: z.preprocess(emptyAsUnset, z.string().optional()),
    /** The path of the private key of the certificate. */
    TLS_KEY_FILE: z.preprocess(emptyAsUnset, z.string().optional()),
});

type TlsEnvironment = z.output<typeof tlsSchema>;

/** Returns the certificate and key files to serve HTTPS with, or `undefined` when the server serves HTTP. */
function filesOf({ NODE_ENV, TLS_CERT_FILE, TLS_KEY_FILE }: TlsEnvironment) {
    if (NODE_ENV !== undefined && NODE_ENV !== 'development') {
        return undefined;
    }
    return { TLS_CERT_FILE: TLS_CERT_FILE ?? DEFAULT_CERT_FILE, TLS_KEY_FILE: TLS_KEY_FILE ?? DEFAULT_KEY_FILE };
}

function isReadableFile(path: string) {
    try {
        accessSync(path, constants.R_OK);

        return statSync(path).isFile();
    } catch {
        return false;
    }
}

/**
 * The rule across `NODE_ENV` and the TLS variables. Spreading the shape of `tlsSchema` drops a refinement, so
 * `environmentSchema` applies this check after merging the shapes of the namespaces.
 *
 * Zod skips a refinement once any variable is invalid, which would hide a missing certificate behind an invalid
 * `HOST`. The check therefore runs whenever its own variables are valid.
 */
export const checkTls = z.superRefine<TlsEnvironment>(
    (environment, context) => {
        if (environment.NODE_ENV === 'production') {
            for (const name of ['TLS_CERT_FILE', 'TLS_KEY_FILE'] as const) {
                const value = environment[name];

                if (value !== undefined) {
                    context.addIssue({
                        code: 'custom',
                        input: value,
                        message: `must be unset when NODE_ENV is production, since the image serves HTTP only, but is "${value}".`,
                        path: [name],
                    });
                }
            }
            return;
        }
        const files = filesOf(environment);

        if (files === undefined) {
            return;
        }
        for (const [name, path] of Object.entries(files)) {
            if (!isReadableFile(path)) {
                context.addIssue({
                    code: 'custom',
                    input: path,
                    message: `must be a readable file, but "${path}" is missing or cannot be read. Run "pnpm run setup-https" to create it.`,
                    path: [name],
                });
            }
        }
    },
    { when: (payload) => tlsSchema.safeParse(payload.value).success },
);

/**
 * The `tls` namespace: the certificate and the key that the server serves HTTPS with, which are `undefined` when it
 * serves HTTP. `src/main.ts` calls the factory directly, since Fastify takes them before the application exists.
 */
export const tlsConfig = registerAs('tls', () => {
    const files = filesOf(tlsSchema.check(checkTls).parse(process.env));

    return { certFile: files?.TLS_CERT_FILE, keyFile: files?.TLS_KEY_FILE };
});
