import type { Environment } from '@/config';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
    const configService = app.get<ConfigService<Environment, true>>(ConfigService);

    // Closes the application on SIGTERM, so a container orchestrator can stop it gracefully.
    app.enableShutdownHooks();

    // Fastify only listens on localhost by default, which a container cannot be reached on.
    await app.listen(configService.get('PORT', { infer: true }), '0.0.0.0');
}

await bootstrap();
