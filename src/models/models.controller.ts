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
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateModelDto } from './dto/create-model.dto';
import { ListModelsDto } from './dto/list-models.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { ModelsService } from './models.service';

@Controller('models')
export class ModelsController {
    constructor(private readonly modelsService: ModelsService) {}

    @Post()
    create(
        @Body() createModelDto: CreateModelDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.modelsService.create(createModelDto, user.id);
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
        return this.modelsService.update(id, updateModelDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.modelsService.remove(id);
    }
}
