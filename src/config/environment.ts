import { z } from 'zod';
import { serverSchema } from './server.config';

/**
 * The schema of every environment variable that the application reads, merged from the schemas of the namespaces.
 * `ConfigModule` validates the environment against it at startup, so an invalid value fails the start rather than let
 * the application run with a broken configuration, and every invalid variable is reported at once.
 */
export const environmentSchema = z.object({
    ...serverSchema.shape,
});
