import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { LoginDto } from '../dto/login.dto';
import { MessagingService } from '../../../messaging/messaging.service';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly messagingService: MessagingService,
    ) {}

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByNickname(loginDto.nickname);

        if (!user || !(await compare(loginDto.password, user.passwordHash))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const authUser = {
            id: user.id,
            nickname: user.nickname,
            name: user.name,
            email: user.email,
        };

        const result = {
            access_token: await this.jwtService.signAsync({
                sub: user.id,
                nickname: user.nickname,
                name: user.name,
                email: user.email,
            }),
            user: authUser,
        };

        void this.messagingService.publish('auth.login', {
            userId: user.id,
            nickname: user.nickname,
            email: user.email,
        });

        return result;
    }
}
