import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { ListBrandsDto } from './dto/list-brands.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import {
    Paginated,
    getPagination,
    getPaginationMeta,
} from '../common/pagination';
import { validateName } from '../common/validators';
import { Model } from '../models/model.entity';

@Injectable()
export class BrandsService {
    constructor(
        @InjectRepository(Brand)
        private readonly brandsRepository: Repository<Brand>,
        @InjectRepository(Model)
        private readonly modelsRepository: Repository<Model>,
    ) {}

    async create(
        createBrandDto: CreateBrandDto,
        createdById: string,
    ): Promise<Brand> {
        const name = validateName(createBrandDto.name);
        await this.ensureNameAvailable(name);

        return this.brandsRepository.save(
            this.brandsRepository.create({
                name,
                createdById,
            }),
        );
    }

    async findAll(query: ListBrandsDto): Promise<Paginated<Brand>> {
        const { page, limit, skip } = getPagination(query);
        const brandsQuery = this.brandsRepository
            .createQueryBuilder('brand')
            .orderBy('brand.name', 'ASC')
            .skip(skip)
            .take(limit);

        if (query.search) {
            brandsQuery.where('LOWER(brand.name) LIKE :search', {
                search: `%${query.search.toLowerCase()}%`,
            });
        }

        const [data, total] = await brandsQuery.getManyAndCount();

        return {
            data,
            meta: getPaginationMeta(page, limit, total),
        };
    }

    async findOne(id: string): Promise<Brand> {
        const brand = await this.brandsRepository.findOne({ where: { id } });

        if (!brand) {
            throw new NotFoundException('Brand not found');
        }

        return brand;
    }

    async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
        const brand = await this.findOne(id);

        if (updateBrandDto.name !== undefined) {
            const name = validateName(updateBrandDto.name);
            await this.ensureNameAvailable(name, id);
            brand.name = name;
        }

        return this.brandsRepository.save(brand);
    }

    async remove(id: string): Promise<void> {
        const brand = await this.findOne(id);
        const modelsCount = await this.modelsRepository.count({
            where: { brandId: id },
        });

        if (modelsCount > 0) {
            throw new ConflictException('Brand has associated models');
        }

        await this.brandsRepository.remove(brand);
    }

    private async ensureNameAvailable(
        name: string,
        ignoreId?: string,
    ): Promise<void> {
        const query = this.brandsRepository
            .createQueryBuilder('brand')
            .where('LOWER(brand.name) = LOWER(:name)', { name });

        if (ignoreId) {
            query.andWhere('brand.id <> :ignoreId', { ignoreId });
        }

        if (await query.getExists()) {
            throw new ConflictException('Brand name already exists');
        }
    }
}
