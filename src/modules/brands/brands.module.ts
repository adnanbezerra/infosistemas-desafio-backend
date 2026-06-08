import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateBrandCommand } from './commands/create-brand.command';
import { DeleteBrandCommand } from './commands/delete-brand.command';
import { UpdateBrandCommand } from './commands/update-brand.command';
import { Brand } from './entities/brand.entity';
import { BrandsController } from './controllers/brands.controller';
import { BrandsService } from './services/brands.service';
import { Model } from '../models/entities/model.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Brand, Model])],
    controllers: [BrandsController],
    providers: [
        BrandsService,
        CreateBrandCommand,
        UpdateBrandCommand,
        DeleteBrandCommand,
    ],
})
export class BrandsModule {}
