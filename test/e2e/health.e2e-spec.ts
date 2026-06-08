import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HealthController } from '../../src/modules/health/controllers/health.controller';
import { createE2eApp } from './helpers/e2e-app';

describe('Health routes (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        app = await createE2eApp({
            controllers: [HealthController],
        });
    });

    afterEach(async () => {
        await app.close();
    });

    it('GET /health returns ok without JWT', async () => {
        await request(app.getHttpServer())
            .get('/health')
            .expect(200)
            .expect({
                success: true,
                data: {
                    status: 'ok',
                },
            });
    });
});
