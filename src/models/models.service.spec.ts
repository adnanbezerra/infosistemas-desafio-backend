import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Brand } from '../brands/brand.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Model } from './model.entity';
import { ModelsService } from './models.service';

const modelId = '11111111-1111-4111-8111-111111111111';
const brandId = '22222222-2222-4222-8222-222222222222';
const userId = '33333333-3333-4333-8333-333333333333';

describe('ModelsService', () => {
    let service: ModelsService;
    let modelsRepository: jest.Mocked<
        Pick<
            Repository<Model>,
            'create' | 'createQueryBuilder' | 'findOne' | 'remove' | 'save'
        >
    >;
    let brandsRepository: jest.Mocked<Pick<Repository<Brand>, 'exists'>>;
    let vehiclesRepository: jest.Mocked<Pick<Repository<Vehicle>, 'count'>>;

    beforeEach(() => {
        modelsRepository = {
            create: jest.fn((data: Partial<Model>) => data as Model),
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            save: jest.fn(),
        };
        brandsRepository = {
            exists: jest.fn(),
        };
        vehiclesRepository = {
            count: jest.fn(),
        };

        service = new ModelsService(
            modelsRepository as Repository<Model>,
            brandsRepository as Repository<Brand>,
            vehiclesRepository as Repository<Vehicle>,
        );
    });

    it('creates model', async () => {
        const model = createModel();

        brandsRepository.exists.mockResolvedValue(true);
        modelsRepository.createQueryBuilder.mockReturnValue(
            createQueryBuilderMock(false),
        );
        modelsRepository.save.mockResolvedValue(model);

        await expect(
            service.create({ name: ' Corolla ', brand_id: brandId }, userId),
        ).resolves.toEqual(model);
        expect(modelsRepository.create).toHaveBeenCalledWith({
            name: 'Corolla',
            brandId,
            createdById: userId,
        });
    });

    it('prevents duplicate model in same brand', async () => {
        brandsRepository.exists.mockResolvedValue(true);
        modelsRepository.createQueryBuilder.mockReturnValue(
            createQueryBuilderMock(true),
        );

        await expect(
            service.create({ name: 'Corolla', brand_id: brandId }, userId),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('prevents creation with missing brand', async () => {
        brandsRepository.exists.mockResolvedValue(false);

        await expect(
            service.create({ name: 'Corolla', brand_id: brandId }, userId),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('prevents removal with associated vehicles', async () => {
        modelsRepository.findOne.mockResolvedValue(createModel());
        vehiclesRepository.count.mockResolvedValue(1);

        await expect(service.remove(modelId)).rejects.toBeInstanceOf(
            ConflictException,
        );
        expect(modelsRepository.remove).not.toHaveBeenCalled();
    });
});

function createModel(overrides: Partial<Model> = {}): Model {
    return {
        id: modelId,
        name: 'Corolla',
        brandId,
        createdById: userId,
        ...overrides,
    } as Model;
}

function createQueryBuilderMock(exists: boolean) {
    return {
        andWhere: jest.fn().mockReturnThis(),
        getExists: jest.fn().mockResolvedValue(exists),
        where: jest.fn().mockReturnThis(),
    } as never;
}
