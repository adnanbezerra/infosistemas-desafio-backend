import { Injectable } from '@nestjs/common';
import { VehiclesService } from '../services/vehicles.service';

@Injectable()
export class DeleteVehicleCommand {
    constructor(private readonly vehiclesService: VehiclesService) {}

    execute(id: string): Promise<void> {
        return this.vehiclesService.remove(id);
    }
}
