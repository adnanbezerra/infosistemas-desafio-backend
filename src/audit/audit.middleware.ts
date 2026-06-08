import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuditService } from './audit.service';

type RequestWithUser = Request & {
    user?: {
        id?: string;
        nickname?: string;
    };
};

@Injectable()
export class AuditMiddleware implements NestMiddleware {
    constructor(private readonly auditService: AuditService) {}

    use(req: RequestWithUser, res: Response, next: NextFunction) {
        const startedAt = Date.now();

        res.on('finish', () => {
            void this.auditService.create({
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
                durationMs: Date.now() - startedAt,
                ip: req.ip,
                userId: req.user?.id,
                userNickname: req.user?.nickname,
                body: this.sanitize(req.body),
                query: req.query,
            });
        });

        next();
    }

    private sanitize(value: unknown): unknown {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return value;
        }

        const sanitized = { ...value } as Record<string, unknown>;

        for (const key of ['password', 'passwordHash', 'access_token']) {
            if (key in sanitized) {
                sanitized[key] = '[redacted]';
            }
        }

        return sanitized;
    }
}
