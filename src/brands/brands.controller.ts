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
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { ListBrandsDto } from './dto/list-brands.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller('brands')
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) {}

    @Post()
    create(
        @Body() createBrandDto: CreateBrandDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.brandsService.create(createBrandDto, user.id);
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
        return this.brandsService.update(id, updateBrandDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.brandsService.remove(id);
    }
}
