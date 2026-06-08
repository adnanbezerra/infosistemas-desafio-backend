import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateVehicleCommand } from '../../src/modules/vehicles/commands/create-vehicle.command';
import { DeleteVehicleCommand } from '../../src/modules/vehicles/commands/delete-vehicle.command';
import { UpdateVehicleCommand } from '../../src/modules/vehicles/commands/update-vehicle.command';
import { VehiclesController } from '../../src/modules/vehicles/controllers/vehicles.controller';
import { VehiclesService } from '../../src/modules/vehicles/services/vehicles.service';
import { MessagingService } from '../../src/messaging/messaging.service';
import { createE2eApp } from './helpers/e2e-app';
import {
    authenticatedUser,
    authToken,
    paginatedResponse,
    vehicleId,
    vehiclePayload,
    vehicleResponse,
} from './helpers/fixtures';

describe('Vehicle routes (e2e)', () => {
    let app: INestApplication;
    let vehiclesService: jest.Mocked<
        Pick<
            VehiclesService,
            'create' | 'findAll' | 'findOne' | 'update' | 'remove'
        >
    >;
    let messagingService: jest.Mocked<Pick<MessagingService, 'publish'>>;

    beforeEach(async () => {
        vehiclesService = {
            create: jest.fn().mockResolvedValue(vehicleResponse),
            findAll: jest
                .fn()
                .mockResolvedValue(paginatedResponse([vehicleResponse])),
            findOne: jest.fn().mockResolvedValue(vehicleResponse),
            update: jest
                .fn()
                .mockResolvedValue({ ...vehicleResponse, year: 2025 }),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        messagingService = {
            publish: jest.fn().mockResolvedValue(undefined),
        };

        app = await createE2eApp({
            controllers: [VehiclesController],
            providers: [
                CreateVehicleCommand,
                UpdateVehicleCommand,
                DeleteVehicleCommand,
                { provide: VehiclesService, useValue: vehiclesService },
                { provide: MessagingService, useValue: messagingService },
            ],
        });
    });

    afterEach(async () => {
        await app.close();
    });

    it.each([
        ['get', '/vehicles'],
        ['post', '/vehicles'],
        ['patch', `/vehicles/${vehicleId}`],
        ['delete', `/vehicles/${vehicleId}`],
    ] as const)('%s %s rejects request without JWT', async (method, url) => {
        await request(app.getHttpServer())[method](url).expect(401).expect({
            success: false,
            statusCode: 401,
            message: 'Unauthorized',
        });
    });

    it('POST /vehicles creates vehicle with authenticated user id', async () => {
        const payload = {
            ...vehiclePayload,
            created_by: 'attacker-id',
        };

        await request(app.getHttpServer())
            .post('/vehicles')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(201)
            .expect({
                success: true,
                data: vehicleResponse,
            });

        expect(vehiclesService.create).toHaveBeenCalledWith(
            payload,
            authenticatedUser.id,
        );
    });

    it('GET /vehicles delegates filters to service', async () => {
        const query = {
            page: '2',
            limit: '5',
            search: 'ABC',
            brand_id: '11111111-1111-4111-8111-111111111111',
            model_id: '22222222-2222-4222-8222-222222222222',
            year: '2024',
        };

        await request(app.getHttpServer())
            .get('/vehicles')
            .set('Authorization', `Bearer ${authToken}`)
            .query(query)
            .expect(200)
            .expect({
                success: true,
                data: paginatedResponse([vehicleResponse]),
            });

        expect(vehiclesService.findAll).toHaveBeenCalledWith(query);
        expect(messagingService.publish).toHaveBeenCalledWith(
            'vehicles.find_all',
            {
                userId: authenticatedUser.id,
                nickname: authenticatedUser.nickname,
                query,
            },
        );
    });

    it('GET /vehicles/:id delegates to service', async () => {
        await request(app.getHttpServer())
            .get(`/vehicles/${vehicleId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)
            .expect({
                success: true,
                data: vehicleResponse,
            });

        expect(vehiclesService.findOne).toHaveBeenCalledWith(vehicleId);
    });

    it('PATCH /vehicles/:id delegates update to service', async () => {
        const payload = { year: 2025 };

        await request(app.getHttpServer())
            .patch(`/vehicles/${vehicleId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(200)
            .expect({
                success: true,
                data: { ...vehicleResponse, year: 2025 },
            });

        expect(vehiclesService.update).toHaveBeenCalledWith(vehicleId, payload);
    });

    it('DELETE /vehicles/:id delegates remove to service', async () => {
        await request(app.getHttpServer())
            .delete(`/vehicles/${vehicleId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)
            .expect({
                success: true,
            });

        expect(vehiclesService.remove).toHaveBeenCalledWith(vehicleId);
    });

    it('GET /vehicles/:id rejects invalid UUID', async () => {
        await request(app.getHttpServer())
            .get('/vehicles/not-a-uuid')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(400)
            .expect({
                success: false,
                statusCode: 400,
                message: 'Validation failed (uuid is expected)',
            });
    });
});
