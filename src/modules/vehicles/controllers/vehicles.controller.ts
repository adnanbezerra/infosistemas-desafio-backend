import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateVehicleCommand } from '../commands/create-vehicle.command';
import { DeleteVehicleCommand } from '../commands/delete-vehicle.command';
import { UpdateVehicleCommand } from '../commands/update-vehicle.command';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { ListVehiclesDto } from '../dto/list-vehicles.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { VehiclesService } from '../services/vehicles.service';

@Controller('vehicles')
export class VehiclesController {
    constructor(
        private readonly vehiclesService: VehiclesService,
        private readonly createVehicleCommand: CreateVehicleCommand,
        private readonly updateVehicleCommand: UpdateVehicleCommand,
        private readonly deleteVehicleCommand: DeleteVehicleCommand,
    ) {}

    @Post()
    create(
        @Body() createVehicleDto: CreateVehicleDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.createVehicleCommand.execute(createVehicleDto, user.id);
    }

    @Get()
    findAll(@Query() query: ListVehiclesDto) {
        return this.vehiclesService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.vehiclesService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateVehicleDto: UpdateVehicleDto,
    ) {
        return this.updateVehicleCommand.execute(id, updateVehicleDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.deleteVehicleCommand.execute(id);
    }
}
