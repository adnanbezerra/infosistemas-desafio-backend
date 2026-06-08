import { INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { LoginCommand } from '../../src/modules/auth/commands/login.command';
import { AuthController } from '../../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { MessagingService } from '../../src/messaging/messaging.service';
import { createE2eApp } from './helpers/e2e-app';
import { authenticatedUser, authToken } from './helpers/fixtures';

describe('Auth routes (e2e)', () => {
    let app: INestApplication;
    let authService: jest.Mocked<Pick<AuthService, 'login'>>;

    beforeEach(async () => {
        authService = {
            login: jest.fn().mockResolvedValue({
                access_token: authToken,
                user: authenticatedUser,
            }),
        };

        app = await createE2eApp({
            controllers: [AuthController],
            providers: [
                LoginCommand,
                { provide: AuthService, useValue: authService },
                { provide: MessagingService, useValue: { publish: jest.fn() } },
            ],
        });
    });

    afterEach(async () => {
        await app.close();
    });

    it('POST /auth/login returns token without JWT', async () => {
        const payload = { nickname: 'aivacol', password: 'aivacol123' };

        await request(app.getHttpServer())
            .post('/auth/login')
            .send(payload)
            .expect(201)
            .expect({
                success: true,
                data: {
                    access_token: authToken,
                    user: authenticatedUser,
                },
            });

        expect(authService.login).toHaveBeenCalledWith(payload);
    });

    it('POST /auth/login maps invalid credentials to 401 response', async () => {
        authService.login.mockRejectedValueOnce(
            new UnauthorizedException('Invalid credentials'),
        );

        await request(app.getHttpServer())
            .post('/auth/login')
            .send({ nickname: 'aivacol', password: 'wrong' })
            .expect(401)
            .expect({
                success: false,
                statusCode: 401,
                message: 'Invalid credentials',
            });
    });
});
