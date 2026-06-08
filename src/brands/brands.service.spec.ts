import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Model } from '../models/model.entity';
import { Brand } from './brand.entity';
import { BrandsService } from './brands.service';

const brandId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

describe('BrandsService', () => {
    let service: BrandsService;
    let brandsRepository: RepositoryMock<Brand>;
    let modelsRepository: CountRepositoryMock;

    beforeEach(() => {
        brandsRepository = {
            create: jest.fn((data: Partial<Brand>) => data as Brand),
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            save: jest.fn(),
        };
        modelsRepository = {
            count: jest.fn(),
        };

        service = new BrandsService(
            brandsRepository as unknown as Repository<Brand>,
            modelsRepository as unknown as Repository<Model>,
        );
    });

    it('creates brand', async () => {
        const brand = createBrand();

        brandsRepository.createQueryBuilder.mockReturnValue(
            createQueryBuilderMock(false),
        );
        brandsRepository.save.mockResolvedValue(brand);

        await expect(
            service.create({ name: ' Toyota ' }, userId),
        ).resolves.toEqual(brand);
        expect(brandsRepository.create).toHaveBeenCalledWith({
            name: 'Toyota',
            createdById: userId,
        });
    });

    it('prevents duplicate brand name', async () => {
        brandsRepository.createQueryBuilder.mockReturnValue(
            createQueryBuilderMock(true),
        );

        await expect(
            service.create({ name: 'Toyota' }, userId),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('removes brand without models', async () => {
        const brand = createBrand();

        brandsRepository.findOne.mockResolvedValue(brand);
        modelsRepository.count.mockResolvedValue(0);

        await expect(service.remove(brandId)).resolves.toBeUndefined();
        expect(brandsRepository.remove).toHaveBeenCalledWith(brand);
    });

    it('prevents removal with associated models', async () => {
        brandsRepository.findOne.mockResolvedValue(createBrand());
        modelsRepository.count.mockResolvedValue(1);

        await expect(service.remove(brandId)).rejects.toBeInstanceOf(
            ConflictException,
        );
        expect(brandsRepository.remove).not.toHaveBeenCalled();
    });
});

function createBrand(overrides: Partial<Brand> = {}): Brand {
    return {
        id: brandId,
        name: 'Toyota',
        createdById: userId,
        ...overrides,
    } as Brand;
}

function createQueryBuilderMock(exists: boolean) {
    return {
        andWhere: jest.fn().mockReturnThis(),
        getExists: jest.fn().mockResolvedValue(exists),
        where: jest.fn().mockReturnThis(),
    } as never;
}

type RepositoryMock<T> = {
    create: jest.Mock<T, [Partial<T>]>;
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    save: jest.Mock;
};

type CountRepositoryMock = {
    count: jest.Mock;
};
