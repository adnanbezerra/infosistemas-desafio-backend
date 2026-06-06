import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health/health.controller';

describe('HealthController', () => {
    let healthController: HealthController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
        }).compile();

        healthController = app.get<HealthController>(HealthController);
    });

    describe('health', () => {
        it('should return service status', () => {
            expect(healthController.check()).toEqual({ status: 'ok' });
        });
    });
});
