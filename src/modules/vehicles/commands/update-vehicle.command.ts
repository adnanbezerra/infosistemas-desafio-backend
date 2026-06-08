import { Injectable } from '@nestjs/common';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { Vehicle } from '../entities/vehicle.entity';
import { VehiclesService } from '../services/vehicles.service';

@Injectable()
export class UpdateVehicleCommand {
    constructor(private readonly vehiclesService: VehiclesService) {}

    execute(id: string, updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
        return this.vehiclesService.update(id, updateVehicleDto);
    }
}
