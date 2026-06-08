import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Model } from '../models/model.entity';
import { RedisModule } from '../redis/redis.module';
import { Vehicle } from './vehicle.entity';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
    imports: [TypeOrmModule.forFeature([Vehicle, Model]), RedisModule],
    controllers: [VehiclesController],
    providers: [VehiclesService],
})
export class VehiclesModule {}
