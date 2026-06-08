import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateModelCommand } from '../../src/modules/models/commands/create-model.command';
import { DeleteModelCommand } from '../../src/modules/models/commands/delete-model.command';
import { UpdateModelCommand } from '../../src/modules/models/commands/update-model.command';
import { ModelsController } from '../../src/modules/models/controllers/models.controller';
import { ModelsService } from '../../src/modules/models/services/models.service';
import { createE2eApp } from './helpers/e2e-app';
import {
    authenticatedUser,
    authToken,
    modelId,
    modelPayload,
    modelResponse,
    paginatedResponse,
} from './helpers/fixtures';

describe('Model routes (e2e)', () => {
    let app: INestApplication;
    let modelsService: jest.Mocked<
        Pick<
            ModelsService,
            'create' | 'findAll' | 'findOne' | 'update' | 'remove'
        >
    >;

    beforeEach(async () => {
        modelsService = {
            create: jest.fn().mockResolvedValue(modelResponse),
            findAll: jest
                .fn()
                .mockResolvedValue(paginatedResponse([modelResponse])),
            findOne: jest.fn().mockResolvedValue(modelResponse),
            update: jest
                .fn()
                .mockResolvedValue({ ...modelResponse, name: 'Civic' }),
            remove: jest.fn().mockResolvedValue(undefined),
        };

        app = await createE2eApp({
            controllers: [ModelsController],
            providers: [
                CreateModelCommand,
                UpdateModelCommand,
                DeleteModelCommand,
                { provide: ModelsService, useValue: modelsService },
            ],
        });
    });

    afterEach(async () => {
        await app.close();
    });

    it.each([
        ['get', '/models'],
        ['post', '/models'],
        ['patch', `/models/${modelId}`],
        ['delete', `/models/${modelId}`],
    ] as const)('%s %s rejects request without JWT', async (method, url) => {
        await request(app.getHttpServer())[method](url).expect(401).expect({
            success: false,
            statusCode: 401,
            message: 'Unauthorized',
        });
    });

    it('POST /models creates model with authenticated user id', async () => {
        await request(app.getHttpServer())
            .post('/models')
            .set('Authorization', `Bearer ${authToken}`)
            .send(modelPayload)
            .expect(201)
            .expect({
                success: true,
                data: modelResponse,
            });

        expect(modelsService.create).toHaveBeenCalledWith(
            modelPayload,
            authenticatedUser.id,
        );
    });

    it('GET /models delegates query to service', async () => {
        const query = { page: '2', limit: '5', search: 'corolla' };

        await request(app.getHttpServer())
            .get('/models')
            .set('Authorization', `Bearer ${authToken}`)
            .query(query)
            .expect(200)
            .expect({
                success: true,
                data: paginatedResponse([modelResponse]),
            });

        expect(modelsService.findAll).toHaveBeenCalledWith(query);
    });

    it('GET /models/:id delegates to service', async () => {
        await request(app.getHttpServer())
            .get(`/models/${modelId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)
            .expect({
                success: true,
                data: modelResponse,
            });

        expect(modelsService.findOne).toHaveBeenCalledWith(modelId);
    });

    it('PATCH /models/:id delegates update to service', async () => {
        const payload = { name: 'Civic' };

        await request(app.getHttpServer())
            .patch(`/models/${modelId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(200)
            .expect({
                success: true,
                data: { ...modelResponse, name: 'Civic' },
            });

        expect(modelsService.update).toHaveBeenCalledWith(modelId, payload);
    });

    it('DELETE /models/:id delegates remove to service', async () => {
        await request(app.getHttpServer())
            .delete(`/models/${modelId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)
            .expect({
                success: true,
            });

        expect(modelsService.remove).toHaveBeenCalledWith(modelId);
    });

    it('GET /models/:id rejects invalid UUID', async () => {
        await request(app.getHttpServer())
            .get('/models/not-a-uuid')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(400)
            .expect({
                success: false,
                statusCode: 400,
                message: 'Validation failed (uuid is expected)',
            });
    });
});
