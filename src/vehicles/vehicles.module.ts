import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './vehicle.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Vehicle])],
})
export class VehiclesModule {}
