import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { validateEnv } from './config/validate-env';
import { createTypeOrmOptions } from './config/typeorm.config';
import { BrandsModule } from './brands/brands.module';
import { HealthModule } from './health/health.module';
import { ModelsModule } from './models/models.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: createTypeOrmOptions,
        }),
        RedisModule,
        HealthModule,
        UsersModule,
        BrandsModule,
        ModelsModule,
        VehiclesModule,
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseInterceptor,
        },
    ],
})
export class AppModule {}
