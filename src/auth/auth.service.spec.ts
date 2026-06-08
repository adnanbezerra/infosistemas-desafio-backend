import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

describe('AuthService', () => {
    let authService: AuthService;
    let usersService: jest.Mocked<Pick<UsersService, 'findByNickname'>>;
    let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;

    beforeEach(() => {
        usersService = {
            findByNickname: jest.fn(),
        };
        jwtService = {
            signAsync: jest.fn().mockResolvedValue('jwt-token'),
        };

        authService = new AuthService(
            usersService as UsersService,
            jwtService as JwtService,
        );
    });

    it('returns token and public user data for valid credentials', async () => {
        usersService.findByNickname.mockResolvedValue(
            createUser({
                passwordHash: await hash('aivacol123', 10),
            }),
        );

        await expect(
            authService.login({
                nickname: 'aivacol',
                password: 'aivacol123',
            }),
        ).resolves.toEqual({
            access_token: 'jwt-token',
            user: {
                id: 'user-id',
                nickname: 'aivacol',
                name: 'Aivacol Admin',
                email: 'aivacol@example.com',
            },
        });
        expect(jwtService.signAsync).toHaveBeenCalledWith({
            sub: 'user-id',
            nickname: 'aivacol',
            name: 'Aivacol Admin',
            email: 'aivacol@example.com',
        });
    });

    it('rejects invalid credentials', async () => {
        usersService.findByNickname.mockResolvedValue(
            createUser({
                passwordHash: await hash('aivacol123', 10),
            }),
        );

        await expect(
            authService.login({
                nickname: 'aivacol',
                password: 'wrong',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });
});

function createUser(overrides: Partial<User> = {}): User {
    return {
        id: 'user-id',
        nickname: 'aivacol',
        name: 'Aivacol Admin',
        email: 'aivacol@example.com',
        passwordHash: 'password-hash',
        ...overrides,
    } as User;
}
