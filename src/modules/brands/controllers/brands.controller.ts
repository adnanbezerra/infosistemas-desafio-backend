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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateBrandCommand } from '../commands/create-brand.command';
import { DeleteBrandCommand } from '../commands/delete-brand.command';
import { UpdateBrandCommand } from '../commands/update-brand.command';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { BrandsService } from '../services/brands.service';
import { ListBrandsDto } from '../dto/list-brands.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';

@Controller('brands')
export class BrandsController {
    constructor(
        private readonly brandsService: BrandsService,
        private readonly createBrandCommand: CreateBrandCommand,
        private readonly updateBrandCommand: UpdateBrandCommand,
        private readonly deleteBrandCommand: DeleteBrandCommand,
    ) {}

    @Post()
    create(
        @Body() createBrandDto: CreateBrandDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.createBrandCommand.execute(createBrandDto, user.id);
    }

    @Get()
    findAll(@Query() query: ListBrandsDto) {
        return this.brandsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.brandsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateBrandDto: UpdateBrandDto,
    ) {
        return this.updateBrandCommand.execute(id, updateBrandDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.deleteBrandCommand.execute(id);
    }
}
