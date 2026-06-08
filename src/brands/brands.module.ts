import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './brand.entity';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { Model } from '../models/model.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Brand, Model])],
    controllers: [BrandsController],
    providers: [BrandsService],
})
export class BrandsModule {}
