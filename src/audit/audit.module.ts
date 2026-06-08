import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditMiddleware } from './audit.middleware';
import { AuditService } from './audit.service';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AuditLog.name, schema: AuditLogSchema },
        ]),
    ],
    providers: [AuditService, AuditMiddleware],
})
export class AuditModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuditMiddleware).forRoutes('*');
    }
}
