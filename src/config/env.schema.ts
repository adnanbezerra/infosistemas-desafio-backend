import { z } from 'zod';

const booleanStringSchema = z
    .string()
    .transform((value) => value.toLowerCase())
    .pipe(z.enum(['true', 'false']))
    .transform((value) => value === 'true');

const numberStringSchema = z.coerce.number().int().positive();

export const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    PORT: numberStringSchema.default(3000),
    DB_HOST: z.string().min(1),
    DB_PORT: numberStringSchema.default(1433),
    DB_USERNAME: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_DATABASE: z.string().min(1),
    DB_SYNCHRONIZE: booleanStringSchema.default(false),
    DB_LOGGING: booleanStringSchema.default(false),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().min(1),
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: numberStringSchema.default(6379),
    REDIS_TTL_SECONDS: numberStringSchema.default(60),
    RABBITMQ_URL: z.string().min(1),
    RABBITMQ_EXCHANGE: z.string().min(1).default('aivacol.events'),
    MONGODB_URI: z.string().min(1),
    DEFAULT_ADMIN_NICKNAME: z.string().min(1),
    DEFAULT_ADMIN_NAME: z.string().min(1),
    DEFAULT_ADMIN_EMAIL: z.email(),
    DEFAULT_ADMIN_PASSWORD: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;
