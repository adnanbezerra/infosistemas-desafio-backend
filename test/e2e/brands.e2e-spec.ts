import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateBrandCommand } from '../../src/modules/brands/commands/create-brand.command';
import { DeleteBrandCommand } from '../../src/modules/brands/commands/delete-brand.command';
import { UpdateBrandCommand } from '../../src/modules/brands/commands/update-brand.command';
import { BrandsController } from '../../src/modules/brands/controllers/brands.controller';
import { BrandsService } from '../../src/modules/brands/services/brands.service';
import { createE2eApp } from './helpers/e2e-app';
import {
    authenticatedUser,
    authToken,
    brandId,
    brandPayload,
    brandResponse,
    paginatedResponse,
} from './helpers/fixtures';

describe('Brand routes (e2e)', () => {
    let app: INestApplication;
    let brandsService: jest.Mocked<
        Pick<
            BrandsService,
            'create' | 'findAll' | 'findOne' | 'update' | 'remove'
        >
    >;

    beforeEach(async () => {
        brandsService = {
            create: jest.fn().mockResolvedValue(brandResponse),
            findAll: jest
                .fn()
                .mockResolvedValue(paginatedResponse([brandResponse])),
            findOne: jest.fn().mockResolvedValue(brandResponse),
            update: jest
                .fn()
                .mockResolvedValue({ ...brandResponse, name: 'Honda' }),
            remove: jest.fn().mockResolvedValue(undefined),
        };

        app = await createE2eApp({
            controllers: [BrandsController],
            providers: [
                CreateBrandCommand,
                UpdateBrandCommand,
                DeleteBrandCommand,
                { provide: BrandsService, useValue: brandsService },
            ],
        });
    });

    afterEach(async () => {
        await app.close();
    });

    it.each([
        ['get', '/brands'],
        ['post', '/brands'],
        ['patch', `/brands/${brandId}`],
        ['delete', `/brands/${brandId}`],
    ] as const)('%s %s rejects request without JWT', async (method, url) => {
        await request(app.getHttpServer())[method](url).expect(401).expect({
            success: false,
            statusCode: 401,
            message: 'Unauthorized',
        });
    });

    it('POST /brands creates brand with authenticated user id', async () => {
        await request(app.getHttpServer())
            .post('/brands')
            .set('Authorization', `Bearer ${authToken}`)
            .send(brandPayload)
            .expect(201)
            .expect({
                success: true,
                data: brandResponse,
            });

        expect(brandsService.create).toHaveBeenCalledWith(
            brandPayload,
            authenticatedUser.id,
        );
    });

    it('GET /brands delegates query to service', async () => {
        const query = { page: '2', limit: '5', search: 'toy' };

        await request(app.getHttpServer())
            .get('/brands')
            .set('Authorization', `Bearer ${authToken}`)
            .query(query)
            .expect(200)
            .expect({
                success: true,
                data: paginatedResponse([brandResponse]),
            });

        expect(brandsService.findAll).toHaveBeenCalledWith(query);
    });

    it('GET /brands/:id delegates to service', async () => {
        await request(app.getHttpServer())
            .get(`/brands/${brandId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)
            .expect({
                success: true,
                data: brandResponse,
            });

        expect(brandsService.findOne).toHaveBeenCalledWith(brandId);
    });

    it('PATCH /brands/:id delegates update to service', async () => {
        const payload = { name: 'Honda' };

        await request(app.getHttpServer())
            .patch(`/brands/${brandId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(200)
            .expect({
                success: true,
                data: { ...brandResponse, name: 'Honda' },
            });

        expect(brandsService.update).toHaveBeenCalledWith(brandId, payload);
    });

    it('DELETE /brands/:id delegates remove to service', async () => {
        await request(app.getHttpServer())
            .delete(`/brands/${brandId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)
            .expect({
                success: true,
            });

        expect(brandsService.remove).toHaveBeenCalledWith(brandId);
    });

    it('GET /brands/:id rejects invalid UUID', async () => {
        await request(app.getHttpServer())
            .get('/brands/not-a-uuid')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(400)
            .expect({
                success: false,
                statusCode: 400,
                message: 'Validation failed (uuid is expected)',
            });
    });
});
