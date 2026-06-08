import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { UsersService } from '../../users/services/users.service';

type JwtPayload = {
    sub: string;
    nickname: string;
    name: string;
    email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        private readonly usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
        });
    }

    async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
        const user = await this.usersService.findById(payload.sub);

        if (!user) {
            throw new UnauthorizedException();
        }

        return {
            id: user.id,
            nickname: user.nickname,
            name: user.name,
            email: user.email,
        };
    }
}
