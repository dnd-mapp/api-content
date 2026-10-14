import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import { emptyAsUnset } from './empty-as-unset';

/** Returns the entries of the comma-separated list, without the spaces around each one. */
function entriesOf(list: string) {
    return list.split(',').map((entry) => entry.trim());
}

/**
 * Returns whether the entry is an origin the way a browser sends it in the `Origin` header: `https://`, a host, and an
 * optional port. `@fastify/cors` compares the header with each entry as a string, so the entry must also be in the form
 * that the URL parser gives an origin, with the host in lower case and no default port. The parser accepts a `*` in a
 * host, which `@fastify/cors` would match literally, so a wildcard is rejected rather than match no origin.
 */
function isOrigin(entry: string) {
    const url = URL.parse(entry);

    return url?.protocol === 'https:' && url.origin === entry && !entry.includes('*');
}

// Reports every invalid entry, each as an issue of its own.
const origins = z.string().check((context) => {
    for (const entry of entriesOf(context.value).filter((entry) => !isOrigin(entry))) {
        context.issues.push({
            code: 'custom',
            input: entry,
            message: `must be a comma-separated list of origins, each "https://", a host, and an optional port, but holds "${entry}".`,
        });
    }
});

/**
 * The schema of the environment variables of the `cors` namespace, which validates them one by one. It keeps
 * `CORS_ORIGINS` a string, since `ConfigModule` copies only strings, numbers, and booleans from the validated `.env`
 * files into `process.env`, and the factory splits it.
 */
export const corsSchema = z.object({
    /** The origins whose pages may read the responses in a browser. Unset allows no cross-origin requests. */
    CORS_ORIGINS: z.preprocess(emptyAsUnset, origins.optional()),
});

/** Validates the variables and converts them to the values of the namespace. */
const corsOriginsSchema = corsSchema.transform(({ CORS_ORIGINS }) => ({
    origins: CORS_ORIGINS === undefined ? [] : entriesOf(CORS_ORIGINS),
}));

/**
 * The `cors` namespace: the origins whose pages may read the responses in a browser. `ConfigModule` has already
 * validated the variables at startup, but a factory only sees `process.env`, so it parses them again for their types.
 */
export const corsConfig = registerAs('cors', () => corsOriginsSchema.parse(process.env));
