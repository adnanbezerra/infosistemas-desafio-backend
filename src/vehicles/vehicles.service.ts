import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    Paginated,
    getPagination,
    getPaginationMeta,
} from '../common/pagination';
import { Model } from '../models/model.entity';
import { RedisService } from '../redis/redis.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './vehicle.entity';

const VEHICLES_CACHE_PATTERN = 'vehicles:*';

@Injectable()
export class VehiclesService {
    constructor(
        @InjectRepository(Vehicle)
        private readonly vehiclesRepository: Repository<Vehicle>,
        @InjectRepository(Model)
        private readonly modelsRepository: Repository<Model>,
        private readonly redisService: RedisService,
    ) {}

    async create(
        createVehicleDto: CreateVehicleDto,
        createdById: string,
    ): Promise<Vehicle> {
        const vehicleData = await this.validateCreateDto(createVehicleDto);
        await this.ensureUniqueFields(vehicleData);

        const vehicle = await this.vehiclesRepository.save(
            this.vehiclesRepository.create({
                ...vehicleData,
                createdById,
            }),
        );

        await this.invalidateCache();

        return vehicle;
    }

    async findAll(query: ListVehiclesDto): Promise<Paginated<Vehicle>> {
        const cacheKey = this.getListCacheKey(query);
        const cached =
            await this.redisService.get<Paginated<Vehicle>>(cacheKey);

        if (cached) {
            return cached;
        }

        const { page, limit, skip } = getPagination(query);
        const vehiclesQuery = this.vehiclesRepository
            .createQueryBuilder('vehicle')
            .leftJoinAndSelect('vehicle.model', 'model')
            .leftJoinAndSelect('model.brand', 'brand')
            .orderBy('vehicle.licensePlate', 'ASC')
            .skip(skip)
            .take(limit);

        if (query.search) {
            vehiclesQuery.andWhere(
                '(LOWER(vehicle.licensePlate) LIKE :search OR LOWER(vehicle.chassis) LIKE :search OR LOWER(vehicle.renavam) LIKE :search)',
                { search: `%${query.search.toLowerCase()}%` },
            );
        }

        if (query.model_id) {
            this.validateUuid(query.model_id, 'model_id');
            vehiclesQuery.andWhere('vehicle.modelId = :modelId', {
                modelId: query.model_id,
            });
        }

        if (query.brand_id) {
            this.validateUuid(query.brand_id, 'brand_id');
            vehiclesQuery.andWhere('model.brandId = :brandId', {
                brandId: query.brand_id,
            });
        }

        if (query.year) {
            vehiclesQuery.andWhere('vehicle.year = :year', {
                year: this.validateYearQuery(query.year),
            });
        }

        const [data, total] = await vehiclesQuery.getManyAndCount();
        const result = {
            data,
            meta: getPaginationMeta(page, limit, total),
        };

        await this.redisService.set(cacheKey, result);

        return result;
    }

    async findOne(id: string): Promise<Vehicle> {
        const cacheKey = this.getOneCacheKey(id);
        const cached = await this.redisService.get<Vehicle>(cacheKey);

        if (cached) {
            return cached;
        }

        const vehicle = await this.vehiclesRepository.findOne({
            where: { id },
            relations: { model: { brand: true } },
        });

        if (!vehicle) {
            throw new NotFoundException('Vehicle not found');
        }

        await this.redisService.set(cacheKey, vehicle);

        return vehicle;
    }

    async update(
        id: string,
        updateVehicleDto: UpdateVehicleDto,
    ): Promise<Vehicle> {
        const vehicle = await this.findOne(id);
        const vehicleData = await this.validateUpdateDto(updateVehicleDto);
        await this.ensureUniqueFields(vehicleData, id);

        Object.assign(vehicle, vehicleData);

        const updated = await this.vehiclesRepository.save(vehicle);
        await this.invalidateCache();

        return updated;
    }

    async remove(id: string): Promise<void> {
        const vehicle = await this.findOne(id);

        await this.vehiclesRepository.remove(vehicle);
        await this.invalidateCache();
    }

    private async validateCreateDto(
        createVehicleDto: CreateVehicleDto,
    ): Promise<{
        licensePlate: string;
        chassis: string;
        renavam: string;
        year: number;
        modelId: string;
    }> {
        const modelId = await this.resolveModelId(createVehicleDto.model_id);

        return {
            licensePlate: this.validateLicensePlate(
                createVehicleDto.license_plate,
            ),
            chassis: this.validateChassis(createVehicleDto.chassis),
            renavam: this.validateRenavam(createVehicleDto.renavam),
            year: this.validateYear(createVehicleDto.year),
            modelId,
        };
    }

    private async validateUpdateDto(
        updateVehicleDto: UpdateVehicleDto,
    ): Promise<Partial<Vehicle>> {
        const vehicleData: Partial<Vehicle> = {};

        if (updateVehicleDto.license_plate !== undefined) {
            vehicleData.licensePlate = this.validateLicensePlate(
                updateVehicleDto.license_plate,
            );
        }

        if (updateVehicleDto.chassis !== undefined) {
            vehicleData.chassis = this.validateChassis(
                updateVehicleDto.chassis,
            );
        }

        if (updateVehicleDto.renavam !== undefined) {
            vehicleData.renavam = this.validateRenavam(
                updateVehicleDto.renavam,
            );
        }

        if (updateVehicleDto.year !== undefined) {
            vehicleData.year = this.validateYear(updateVehicleDto.year);
        }

        if (updateVehicleDto.model_id !== undefined) {
            vehicleData.modelId = await this.resolveModelId(
                updateVehicleDto.model_id,
            );
        }

        return vehicleData;
    }

    private async resolveModelId(modelId: string): Promise<string> {
        this.validateUuid(modelId, 'model_id');

        const modelExists = await this.modelsRepository.exists({
            where: { id: modelId },
        });

        if (!modelExists) {
            throw new NotFoundException('Model not found');
        }

        return modelId;
    }

    private async ensureUniqueFields(
        vehicleData: Partial<Vehicle>,
        ignoreId?: string,
    ): Promise<void> {
        const checks = [
            {
                field: 'licensePlate',
                value: vehicleData.licensePlate,
                message: 'Vehicle license_plate already exists',
            },
            {
                field: 'chassis',
                value: vehicleData.chassis,
                message: 'Vehicle chassis already exists',
            },
            {
                field: 'renavam',
                value: vehicleData.renavam,
                message: 'Vehicle renavam already exists',
            },
        ] as const;

        for (const check of checks) {
            if (check.value === undefined) {
                continue;
            }

            const query = this.vehiclesRepository
                .createQueryBuilder('vehicle')
                .where(`vehicle.${check.field} = :value`, {
                    value: check.value,
                });

            if (ignoreId) {
                query.andWhere('vehicle.id <> :ignoreId', { ignoreId });
            }

            if (await query.getExists()) {
                throw new ConflictException(check.message);
            }
        }
    }

    private validateLicensePlate(value: unknown): string {
        if (typeof value !== 'string') {
            throw new BadRequestException('license_plate must be a string');
        }

        const licensePlate = value.trim().toUpperCase();

        if (licensePlate.length < 7 || licensePlate.length > 8) {
            throw new BadRequestException(
                'license_plate must be between 7 and 8 chars',
            );
        }

        return licensePlate;
    }

    private validateChassis(value: unknown): string {
        if (typeof value !== 'string') {
            throw new BadRequestException('chassis must be a string');
        }

        const chassis = value.trim();

        if (chassis.length < 6 || chassis.length > 30) {
            throw new BadRequestException(
                'chassis must be between 6 and 30 chars',
            );
        }

        return chassis;
    }

    private validateRenavam(value: unknown): string {
        if (typeof value !== 'string') {
            throw new BadRequestException('renavam must be a string');
        }

        const renavam = value.trim();

        if (renavam.length < 9 || renavam.length > 11) {
            throw new BadRequestException(
                'renavam must be between 9 and 11 chars',
            );
        }

        return renavam;
    }

    private validateYear(value: unknown): number {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
            throw new BadRequestException('year must be an integer');
        }

        return this.validateYearRange(value);
    }

    private validateYearQuery(value: string): number {
        const year = Number(value);

        if (!Number.isInteger(year)) {
            throw new BadRequestException('year must be an integer');
        }

        return this.validateYearRange(year);
    }

    private validateYearRange(year: number): number {
        const maxYear = new Date().getFullYear() + 1;

        if (year < 1900 || year > maxYear) {
            throw new BadRequestException(
                `year must be between 1900 and ${maxYear}`,
            );
        }

        return year;
    }

    private validateUuid(value: unknown, field: string): void {
        if (
            typeof value !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                value,
            )
        ) {
            throw new BadRequestException(`${field} must be a UUID`);
        }
    }

    private getListCacheKey(query: ListVehiclesDto): string {
        const { page, limit } = getPagination(query);
        const normalized = {
            brand_id: query.brand_id ?? null,
            limit,
            model_id: query.model_id ?? null,
            page,
            search: query.search ?? null,
            year: query.year ?? null,
        };

        return `vehicles:list:${JSON.stringify(normalized)}`;
    }

    private getOneCacheKey(id: string): string {
        return `vehicles:${id}`;
    }

    private async invalidateCache(): Promise<void> {
        await this.redisService.delByPattern(VEHICLES_CACHE_PATTERN);
    }
}
