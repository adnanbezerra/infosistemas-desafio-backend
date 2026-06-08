import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateVehicleCommand } from './commands/create-vehicle.command';
import { DeleteVehicleCommand } from './commands/delete-vehicle.command';
import { UpdateVehicleCommand } from './commands/update-vehicle.command';
import { Model } from '../models/entities/model.entity';
import { MessagingModule } from '../../messaging/messaging.module';
import { RedisModule } from '../../redis/redis.module';
import { Vehicle } from './entities/vehicle.entity';
import { VehiclesController } from './controllers/vehicles.controller';
import { VehiclesService } from './services/vehicles.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Vehicle, Model]),
        RedisModule,
        MessagingModule,
    ],
    controllers: [VehiclesController],
    providers: [
        VehiclesService,
        CreateVehicleCommand,
        UpdateVehicleCommand,
        DeleteVehicleCommand,
    ],
})
export class VehiclesModule {}
