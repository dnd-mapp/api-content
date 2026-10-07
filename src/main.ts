import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

    // Closes the application on SIGTERM, so a container orchestrator can stop it gracefully.
    app.enableShutdownHooks();

    // Fastify only listens on localhost by default, which a container cannot be reached on.
    await app.listen(process.env['PORT'] ?? 3000, '0.0.0.0');
}

await bootstrap();
