import { Injectable } from '@nestjs/common';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { Brand } from '../entities/brand.entity';
import { BrandsService } from '../services/brands.service';

@Injectable()
export class UpdateBrandCommand {
    constructor(private readonly brandsService: BrandsService) {}

    execute(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
        return this.brandsService.update(id, updateBrandDto);
    }
}
