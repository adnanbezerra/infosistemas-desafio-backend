import {
    CanActivate,
    ExecutionContext,
    INestApplication,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { IS_PUBLIC_KEY } from '../src/auth/public.decorator';
import { VehiclesController } from '../src/vehicles/vehicles.controller';
import { VehiclesService } from '../src/vehicles/vehicles.service';

describe('API routes (e2e)', () => {
    let app: INestApplication<App>;
    let authService: jest.Mocked<Pick<AuthService, 'login'>>;
    let vehiclesService: jest.Mocked<Pick<VehiclesService, 'create'>>;

    beforeEach(async () => {
        authService = {
            login: jest.fn().mockResolvedValue({
                access_token: 'jwt-token',
                user: {
                    id: 'user-id',
                    nickname: 'aivacol',
                    name: 'Aivacol Admin',
                    email: 'aivacol@example.com',
                },
            }),
        };
        vehiclesService = {
            create: jest.fn(),
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [AuthController, VehiclesController],
            providers: [
                Reflector,
                { provide: AuthService, useValue: authService },
                { provide: VehiclesService, useValue: vehiclesService },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalGuards(new TestJwtGuard(app.get(Reflector)));
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('POST /auth/login returns token', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({ nickname: 'aivacol', password: 'aivacol123' })
            .expect(201)
            .expect({
                access_token: 'jwt-token',
                user: {
                    id: 'user-id',
                    nickname: 'aivacol',
                    name: 'Aivacol Admin',
                    email: 'aivacol@example.com',
                },
            });
    });

    it('GET /vehicles rejects request without JWT', async () => {
        await request(app.getHttpServer()).get('/vehicles').expect(401);
    });

    it('POST /vehicles rejects request without JWT', async () => {
        await request(app.getHttpServer())
            .post('/vehicles')
            .send({
                license_plate: 'ABC1D23',
                chassis: 'CHASSIS123',
                renavam: '123456789',
                year: 2024,
                model_id: '11111111-1111-4111-8111-111111111111',
                created_by: 'attacker-id',
            })
            .expect(401);
        expect(vehiclesService.create).not.toHaveBeenCalled();
    });
});

class TestJwtGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<{
            headers: { authorization?: string };
        }>();

        if (request.headers.authorization === 'Bearer jwt-token') {
            return true;
        }

        throw new UnauthorizedException();
    }
}
