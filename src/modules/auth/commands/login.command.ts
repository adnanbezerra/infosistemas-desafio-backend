import { Injectable } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LoginCommand {
    constructor(private readonly authService: AuthService) {}

    execute(loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
}
