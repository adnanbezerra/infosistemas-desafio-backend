import { Injectable } from '@nestjs/common';
import { ModelsService } from '../services/models.service';

@Injectable()
export class DeleteModelCommand {
    constructor(private readonly modelsService: ModelsService) {}

    execute(id: string): Promise<void> {
        return this.modelsService.remove(id);
    }
}
