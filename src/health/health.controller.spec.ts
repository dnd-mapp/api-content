import { TerminusModule } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
    let controller: HealthController;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [TerminusModule],
            controllers: [HealthController],
        }).compile();

        controller = module.get(HealthController);
    });

    it('reports that the application is live', async () => {
        await expect(controller.live()).resolves.toEqual({ status: 'ok', info: {}, error: {}, details: {} });
    });

    it('reports that the application is ready', async () => {
        await expect(controller.ready()).resolves.toEqual({ status: 'ok', info: {}, error: {}, details: {} });
    });
});
