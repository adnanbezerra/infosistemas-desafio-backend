import {
    CanActivate,
    ExecutionContext,
    INestApplication,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModuleMetadata } from '@nestjs/testing';
import { ResponseInterceptor } from '../../../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../../../src/common/filters/http-exception.filter';
import { IS_PUBLIC_KEY } from '../../../src/modules/auth/decorators/public.decorator';
import { authenticatedUser, authToken } from './fixtures';

export async function createE2eApp(
    metadata: TestingModuleMetadata,
): Promise<INestApplication> {
    const moduleFixture = await Test.createTestingModule({
        ...metadata,
        providers: [Reflector, ...(metadata.providers ?? [])],
    }).compile();

    const app = moduleFixture.createNestApplication();

    app.useGlobalGuards(new TestJwtGuard(app.get(Reflector)));
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    return app;
}

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
            user?: typeof authenticatedUser;
        }>();

        if (request.headers.authorization === `Bearer ${authToken}`) {
            request.user = authenticatedUser;
            return true;
        }

        throw new UnauthorizedException();
    }
}
