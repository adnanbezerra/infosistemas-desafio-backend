import { Injectable } from '@nestjs/common';
import { UpdateModelDto } from '../dto/update-model.dto';
import { Model } from '../entities/model.entity';
import { ModelsService } from '../services/models.service';

@Injectable()
export class UpdateModelCommand {
    constructor(private readonly modelsService: ModelsService) {}

    execute(id: string, updateModelDto: UpdateModelDto): Promise<Model> {
        return this.modelsService.update(id, updateModelDto);
    }
}
