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
import { CreateModelCommand } from '../commands/create-model.command';
import { DeleteModelCommand } from '../commands/delete-model.command';
import { UpdateModelCommand } from '../commands/update-model.command';
import { CreateModelDto } from '../dto/create-model.dto';
import { ListModelsDto } from '../dto/list-models.dto';
import { UpdateModelDto } from '../dto/update-model.dto';
import { ModelsService } from '../services/models.service';

@Controller('models')
export class ModelsController {
    constructor(
        private readonly modelsService: ModelsService,
        private readonly createModelCommand: CreateModelCommand,
        private readonly updateModelCommand: UpdateModelCommand,
        private readonly deleteModelCommand: DeleteModelCommand,
    ) {}

    @Post()
    create(
        @Body() createModelDto: CreateModelDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.createModelCommand.execute(createModelDto, user.id);
    }

    @Get()
    findAll(@Query() query: ListModelsDto) {
        return this.modelsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.modelsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateModelDto: UpdateModelDto,
    ) {
        return this.updateModelCommand.execute(id, updateModelDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.deleteModelCommand.execute(id);
    }
}
