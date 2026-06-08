import { Injectable } from '@nestjs/common';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { Brand } from '../entities/brand.entity';
import { BrandsService } from '../services/brands.service';

@Injectable()
export class CreateBrandCommand {
    constructor(private readonly brandsService: BrandsService) {}

    execute(
        createBrandDto: CreateBrandDto,
        createdById: string,
    ): Promise<Brand> {
        return this.brandsService.create(createBrandDto, createdById);
    }
}
