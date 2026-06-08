import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({
    collection: 'audit_logs',
    timestamps: true,
})
export class AuditLog {
    @Prop({ required: true, trim: true })
    method: string;

    @Prop({ required: true, trim: true })
    path: string;

    @Prop({ required: true, min: 100, max: 599 })
    statusCode: number;

    @Prop({ required: true, min: 0 })
    durationMs: number;

    @Prop({ trim: true })
    ip?: string;

    @Prop({ trim: true })
    userId?: string;

    @Prop({ trim: true })
    userNickname?: string;

    @Prop({ type: MongooseSchema.Types.Mixed })
    body?: unknown;

    @Prop({ type: MongooseSchema.Types.Mixed })
    query?: unknown;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
