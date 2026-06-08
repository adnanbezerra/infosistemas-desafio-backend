import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './model.entity';
import { CreateModelDto } from './dto/create-model.dto';
import { ListModelsDto } from './dto/list-models.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import {
    Paginated,
    getPagination,
    getPaginationMeta,
} from '../common/pagination';
import { validateName } from '../common/validators';
import { Brand } from '../brands/brand.entity';
import { Vehicle } from '../vehicles/vehicle.entity';

@Injectable()
export class ModelsService {
    constructor(
        @InjectRepository(Model)
        private readonly modelsRepository: Repository<Model>,
        @InjectRepository(Brand)
        private readonly brandsRepository: Repository<Brand>,
        @InjectRepository(Vehicle)
        private readonly vehiclesRepository: Repository<Vehicle>,
    ) {}

    async create(
        createModelDto: CreateModelDto,
        createdById: string,
    ): Promise<Model> {
        const name = validateName(createModelDto.name);
        const brandId = await this.resolveBrandId(createModelDto.brand_id);
        await this.ensureNameAvailable(name, brandId);

        return this.modelsRepository.save(
            this.modelsRepository.create({
                name,
                brandId,
                createdById,
            }),
        );
    }

    async findAll(query: ListModelsDto): Promise<Paginated<Model>> {
        const { page, limit, skip } = getPagination(query);
        const modelsQuery = this.modelsRepository
            .createQueryBuilder('model')
            .leftJoinAndSelect('model.brand', 'brand')
            .orderBy('model.name', 'ASC')
            .skip(skip)
            .take(limit);

        if (query.search) {
            modelsQuery.andWhere('LOWER(model.name) LIKE :search', {
                search: `%${query.search.toLowerCase()}%`,
            });
        }

        if (query.brand_id) {
            this.validateUuid(query.brand_id, 'brand_id');
            modelsQuery.andWhere('model.brandId = :brandId', {
                brandId: query.brand_id,
            });
        }

        const [data, total] = await modelsQuery.getManyAndCount();

        return {
            data,
            meta: getPaginationMeta(page, limit, total),
        };
    }

    async findOne(id: string): Promise<Model> {
        const model = await this.modelsRepository.findOne({
            where: { id },
            relations: { brand: true },
        });

        if (!model) {
            throw new NotFoundException('Model not found');
        }

        return model;
    }

    async update(id: string, updateModelDto: UpdateModelDto): Promise<Model> {
        const model = await this.findOne(id);
        const name =
            updateModelDto.name === undefined
                ? model.name
                : validateName(updateModelDto.name);
        const brandId =
            updateModelDto.brand_id === undefined
                ? model.brandId
                : await this.resolveBrandId(updateModelDto.brand_id);

        await this.ensureNameAvailable(name, brandId, id);

        model.name = name;
        model.brandId = brandId;

        return this.modelsRepository.save(model);
    }

    async remove(id: string): Promise<void> {
        const model = await this.findOne(id);
        const vehiclesCount = await this.vehiclesRepository.count({
            where: { modelId: id },
        });

        if (vehiclesCount > 0) {
            throw new ConflictException('Model has associated vehicles');
        }

        await this.modelsRepository.remove(model);
    }

    private async resolveBrandId(
        brandId: string | null | undefined,
    ): Promise<string | null> {
        if (brandId === undefined || brandId === null) {
            return null;
        }

        this.validateUuid(brandId, 'brand_id');

        const brandExists = await this.brandsRepository.exists({
            where: { id: brandId },
        });

        if (!brandExists) {
            throw new NotFoundException('Brand not found');
        }

        return brandId;
    }

    private async ensureNameAvailable(
        name: string,
        brandId: string | null,
        ignoreId?: string,
    ): Promise<void> {
        const query = this.modelsRepository
            .createQueryBuilder('model')
            .where('LOWER(model.name) = LOWER(:name)', { name });

        if (brandId === null) {
            query.andWhere('model.brandId IS NULL');
        } else {
            query.andWhere('model.brandId = :brandId', { brandId });
        }

        if (ignoreId) {
            query.andWhere('model.id <> :ignoreId', { ignoreId });
        }

        if (await query.getExists()) {
            throw new ConflictException('Model name already exists');
        }
    }

    private validateUuid(value: string, field: string): void {
        if (
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                value,
            )
        ) {
            throw new BadRequestException(`${field} must be a UUID`);
        }
    }
}
