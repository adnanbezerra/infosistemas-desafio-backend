import { Injectable } from '@nestjs/common';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { Vehicle } from '../entities/vehicle.entity';
import { VehiclesService } from '../services/vehicles.service';

@Injectable()
export class CreateVehicleCommand {
    constructor(private readonly vehiclesService: VehiclesService) {}

    execute(
        createVehicleDto: CreateVehicleDto,
        createdById: string,
    ): Promise<Vehicle> {
        return this.vehiclesService.create(createVehicleDto, createdById);
    }
}
