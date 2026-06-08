import { Body, Controller, Post } from '@nestjs/common';
import { LoginCommand } from '../commands/login.command';
import { LoginDto } from '../dto/login.dto';
import { Public } from '../decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly loginCommand: LoginCommand) {}

    @Public()
    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.loginCommand.execute(loginDto);
    }
}
