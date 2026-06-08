import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

type CreateAuditLog = {
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    ip?: string;
    userId?: string;
    userNickname?: string;
    body?: unknown;
    query?: unknown;
};

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectModel(AuditLog.name)
        private readonly auditLogModel: Model<AuditLogDocument>,
    ) {}

    async create(log: CreateAuditLog): Promise<void> {
        try {
            await this.auditLogModel.create(log);
        } catch (error) {
            this.logger.warn(
                `Could not write audit log: ${
                    error instanceof Error ? error.message : 'unknown error'
                }`,
            );
        }
    }
}
