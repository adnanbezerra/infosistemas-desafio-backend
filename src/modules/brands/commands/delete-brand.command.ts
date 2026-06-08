import { Injectable } from '@nestjs/common';
import { BrandsService } from '../services/brands.service';

@Injectable()
export class DeleteBrandCommand {
    constructor(private readonly brandsService: BrandsService) {}

    execute(id: string): Promise<void> {
        return this.brandsService.remove(id);
    }
}
