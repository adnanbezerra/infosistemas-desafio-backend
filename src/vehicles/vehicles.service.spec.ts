import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Model } from '../models/model.entity';
import { RedisService } from '../redis/redis.service';
import { Vehicle } from './vehicle.entity';
import { VehiclesService } from './vehicles.service';

const vehicleId = '11111111-1111-4111-8111-111111111111';
const modelId = '22222222-2222-4222-8222-222222222222';
const brandId = '33333333-3333-4333-8333-333333333333';
const userId = '44444444-4444-4444-8444-444444444444';

describe('VehiclesService', () => {
    let service: VehiclesService;
    let vehiclesRepository: jest.Mocked<
        Pick<
            Repository<Vehicle>,
            'create' | 'createQueryBuilder' | 'findOne' | 'remove' | 'save'
        >
    >;
    let modelsRepository: jest.Mocked<Pick<Repository<Model>, 'exists'>>;
    let redisService: jest.Mocked<
        Pick<RedisService, 'delByPattern' | 'get' | 'set'>
    >;

    beforeEach(() => {
        vehiclesRepository = {
            create: jest.fn((data: Partial<Vehicle>) => data as Vehicle),
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            save: jest.fn(),
        };
        modelsRepository = {
            exists: jest.fn(),
        };
        redisService = {
            delByPattern: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
        };

        service = new VehiclesService(
            vehiclesRepository as Repository<Vehicle>,
            modelsRepository as Repository<Model>,
            redisService as RedisService,
        );
    });

    it('creates vehicle with uppercase license plate and invalidates cache', async () => {
        const uniqueQuery = createQueryBuilderMock({ exists: false });
        const vehicle = createVehicle();

        modelsRepository.exists.mockResolvedValue(true);
        vehiclesRepository.createQueryBuilder.mockReturnValue(uniqueQuery);
        vehiclesRepository.save.mockResolvedValue(vehicle);

        await expect(
            service.create(
                {
                    license_plate: 'abc1d23',
                    chassis: 'CHASSIS123',
                    renavam: '123456789',
                    year: 2024,
                    model_id: modelId,
                },
                userId,
            ),
        ).resolves.toEqual(vehicle);

        expect(vehiclesRepository.create).toHaveBeenCalledWith({
            licensePlate: 'ABC1D23',
            chassis: 'CHASSIS123',
            renavam: '123456789',
            year: 2024,
            modelId,
            createdById: userId,
        });
        expect(redisService.delByPattern).toHaveBeenCalledWith('vehicles:*');
    });

    it('returns cached list without querying database', async () => {
        const cached = {
            data: [createVehicle()],
            meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
        };

        redisService.get.mockResolvedValue(cached);

        await expect(service.findAll({})).resolves.toEqual(cached);
        expect(vehiclesRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('caches list by deterministic query key', async () => {
        const queryBuilder = createQueryBuilderMock({
            manyAndCount: [[createVehicle()], 1],
        });

        redisService.get.mockResolvedValue(null);
        vehiclesRepository.createQueryBuilder.mockReturnValue(queryBuilder);

        await service.findAll({
            brand_id: brandId,
            limit: '5',
            model_id: modelId,
            page: '2',
            search: 'ABC',
            year: '2024',
        });

        expect(redisService.get).toHaveBeenCalledWith(
            `vehicles:list:${JSON.stringify({
                brand_id: brandId,
                limit: 5,
                model_id: modelId,
                page: 2,
                search: 'ABC',
                year: '2024',
            })}`,
        );
        expect(redisService.set).toHaveBeenCalledWith(
            expect.stringMatching(/^vehicles:list:/),
            {
                data: [createVehicle()],
                meta: { page: 2, limit: 5, total: 1, totalPages: 1 },
            },
        );
    });

    it('returns cached vehicle without querying database', async () => {
        const vehicle = createVehicle();

        redisService.get.mockResolvedValue(vehicle);

        await expect(service.findOne(vehicleId)).resolves.toEqual(vehicle);
        expect(vehiclesRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws 404 when vehicle does not exist', async () => {
        redisService.get.mockResolvedValue(null);
        vehiclesRepository.findOne.mockResolvedValue(null);

        await expect(service.findOne(vehicleId)).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(redisService.set).not.toHaveBeenCalled();
    });

    it('throws 404 when model does not exist', async () => {
        modelsRepository.exists.mockResolvedValue(false);

        await expect(
            service.create(
                {
                    license_plate: 'ABC1D23',
                    chassis: 'CHASSIS123',
                    renavam: '123456789',
                    year: 2024,
                    model_id: modelId,
                },
                userId,
            ),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws 400 for invalid year', async () => {
        modelsRepository.exists.mockResolvedValue(true);

        await expect(
            service.create(
                {
                    license_plate: 'ABC1D23',
                    chassis: 'CHASSIS123',
                    renavam: '123456789',
                    year: 1899,
                    model_id: modelId,
                },
                userId,
            ),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws 409 for duplicate license plate', async () => {
        const uniqueQuery = createQueryBuilderMock({ exists: true });

        modelsRepository.exists.mockResolvedValue(true);
        vehiclesRepository.createQueryBuilder.mockReturnValue(uniqueQuery);

        await expect(
            service.create(
                {
                    license_plate: 'ABC1D23',
                    chassis: 'CHASSIS123',
                    renavam: '123456789',
                    year: 2024,
                    model_id: modelId,
                },
                userId,
            ),
        ).rejects.toBeInstanceOf(ConflictException);
    });
});

function createVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
    return {
        id: vehicleId,
        licensePlate: 'ABC1D23',
        chassis: 'CHASSIS123',
        renavam: '123456789',
        year: 2024,
        modelId,
        ...overrides,
    } as Vehicle;
}

function createQueryBuilderMock({
    exists = false,
    manyAndCount = [[], 0],
}: {
    exists?: boolean;
    manyAndCount?: [Vehicle[], number];
}) {
    return {
        andWhere: jest.fn().mockReturnThis(),
        getExists: jest.fn().mockResolvedValue(exists),
        getManyAndCount: jest.fn().mockResolvedValue(manyAndCount),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
    } as never;
}
