import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateModelCommand } from './commands/create-model.command';
import { DeleteModelCommand } from './commands/delete-model.command';
import { UpdateModelCommand } from './commands/update-model.command';
import { Model } from './entities/model.entity';
import { ModelsController } from './controllers/models.controller';
import { ModelsService } from './services/models.service';
import { Brand } from '../brands/entities/brand.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Model, Brand, Vehicle])],
    controllers: [ModelsController],
    providers: [
        ModelsService,
        CreateModelCommand,
        UpdateModelCommand,
        DeleteModelCommand,
    ],
})
export class ModelsModule {}
