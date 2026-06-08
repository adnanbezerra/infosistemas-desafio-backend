import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './audit/audit.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { validateEnv } from './config/validate-env';
import { createTypeOrmOptions } from './config/typeorm.config';
import { BrandsModule } from './modules/brands/brands.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { ModelsModule } from './modules/models/models.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';

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
        MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                uri: configService.getOrThrow<string>('MONGODB_URI'),
            }),
        }),
        AuditModule,
        RedisModule,
        AuthModule,
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
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule {}
