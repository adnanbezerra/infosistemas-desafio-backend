import { Injectable } from '@nestjs/common';
import { CreateModelDto } from '../dto/create-model.dto';
import { Model } from '../entities/model.entity';
import { ModelsService } from '../services/models.service';

@Injectable()
export class CreateModelCommand {
    constructor(private readonly modelsService: ModelsService) {}

    execute(
        createModelDto: CreateModelDto,
        createdById: string,
    ): Promise<Model> {
        return this.modelsService.create(createModelDto, createdById);
    }
}
