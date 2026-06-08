import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

type ApiResponse = {
    success: true;
    data: unknown;
};

@Injectable()
export class ResponseInterceptor implements NestInterceptor<
    unknown,
    ApiResponse
> {
    intercept(
        _context: ExecutionContext,
        next: CallHandler<unknown>,
    ): Observable<ApiResponse> {
        return next.handle().pipe(
            map((data) => ({
                success: true,
                data,
            })),
        );
    }
}
