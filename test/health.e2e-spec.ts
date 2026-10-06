import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.ts';

describe('Health endpoints (e2e)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('GET /health/live answers 200 with the health check result', async () => {
        const response = await request(app.getHttpServer()).get('/health/live').expect(200);

        expect(response.body).toEqual({ status: 'ok', info: {}, error: {}, details: {} });
    });

    it('GET /health/ready answers 200 with the health check result', async () => {
        const response = await request(app.getHttpServer()).get('/health/ready').expect(200);

        expect(response.body).toEqual({ status: 'ok', info: {}, error: {}, details: {} });
    });

    it('tells caches to never store a health check result', async () => {
        const response = await request(app.getHttpServer()).get('/health/live').expect(200);

        expect(response.headers['cache-control']).toContain('no-cache');
    });

    it('serves nothing else', async () => {
        await request(app.getHttpServer()).get('/').expect(404);
    });
});
