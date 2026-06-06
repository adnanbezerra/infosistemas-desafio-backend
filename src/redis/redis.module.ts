import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const client = createClient({
                    socket: {
                        host: config.getOrThrow<string>('REDIS_HOST'),
                        port: config.getOrThrow<number>('REDIS_PORT'),
                    },
                });

                client.on('error', (error) => {
                    console.error('Redis error', error);
                });

                return client;
            },
        },
        RedisService,
    ],
    exports: [RedisService],
})
export class RedisModule {}
