import { environmentSchema, serverConfig } from '@/config';
import { HealthModule } from '@/health';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * Loads the `.env` files and validates the environment. `src/main.ts` awaits it before it creates the application,
 * since Fastify takes the certificate and the key of the `tls` namespace when the adapter is created.
 */
export const configModule = ConfigModule.forRoot({
    cache: true,
    // The first file that sets a variable wins, and a variable set in the process wins over both files.
    envFilePath: ['.env.local', '.env'],
    isGlobal: true,
    load: [serverConfig],
    validationSchema: environmentSchema,
});

@Module({
    imports: [configModule, HealthModule],
})
export class AppModule {}
