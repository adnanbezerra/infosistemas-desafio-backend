import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Model } from './model.entity';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { Brand } from '../brands/brand.entity';
import { Vehicle } from '../vehicles/vehicle.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Model, Brand, Vehicle])],
    controllers: [ModelsController],
    providers: [ModelsService],
})
export class ModelsModule {}
