import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RedisClientType } from 'redis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
    constructor(
        @Inject(REDIS_CLIENT) private readonly client: RedisClientType,
        private readonly config: ConfigService,
    ) {}

    async get<T>(key: string): Promise<T | null> {
        await this.ensureConnected();
        const value = await this.client.get(key);

        return value ? (JSON.parse(value) as T) : null;
    }

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        await this.ensureConnected();
        await this.client.set(key, JSON.stringify(value), {
            EX:
                ttlSeconds ??
                this.config.getOrThrow<number>('REDIS_TTL_SECONDS'),
        });
    }

    async del(key: string): Promise<void> {
        await this.ensureConnected();
        await this.client.del(key);
    }

    async onModuleDestroy(): Promise<void> {
        if (this.client.isOpen) {
            await this.client.quit();
        }
    }

    private async ensureConnected(): Promise<void> {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }
}
