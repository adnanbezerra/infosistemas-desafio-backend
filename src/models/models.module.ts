import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Model } from './model.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Model])],
})
export class ModelsModule {}
