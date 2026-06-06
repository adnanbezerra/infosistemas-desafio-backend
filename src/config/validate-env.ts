import { envSchema } from './env.schema';

export function validateEnv(config: Record<string, unknown>) {
    const parsed = envSchema.safeParse(config);

    if (!parsed.success) {
        throw new Error(`Invalid environment: ${parsed.error.message}`);
    }

    return parsed.data;
}
