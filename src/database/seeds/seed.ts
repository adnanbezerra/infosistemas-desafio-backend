import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { Brand } from '../../brands/brand.entity';
import { Model } from '../../models/model.entity';
import { User } from '../../users/user.entity';
import { Vehicle } from '../../vehicles/vehicle.entity';

type SeedVehicle = {
    licensePlate: string;
    chassis: string;
    renavam: string;
    year: number;
    brand: string;
    model: string;
};

const seedBrands = ['Toyota', 'Volkswagen', 'Chevrolet'];
const seedModels = [
    { name: 'Corolla', brand: 'Toyota' },
    { name: 'Hilux', brand: 'Toyota' },
    { name: 'Gol', brand: 'Volkswagen' },
    { name: 'Onix', brand: 'Chevrolet' },
];

async function readSeedVehicles(): Promise<SeedVehicle[]> {
    const file = await readFile(
        join(process.cwd(), 'seed_vehicles.json'),
        'utf8',
    );

    return JSON.parse(file) as SeedVehicle[];
}

async function seed() {
    await dataSource.initialize();

    try {
        const usersRepository = dataSource.getRepository(User);
        const brandsRepository = dataSource.getRepository(Brand);
        const modelsRepository = dataSource.getRepository(Model);
        const vehiclesRepository = dataSource.getRepository(Vehicle);

        const adminNickname = process.env.DEFAULT_ADMIN_NICKNAME ?? 'aivacol';
        const adminEmail =
            process.env.DEFAULT_ADMIN_EMAIL ?? 'aivacol@example.com';

        let admin = await usersRepository.findOne({
            where: [{ nickname: adminNickname }, { email: adminEmail }],
        });

        if (!admin) {
            admin = usersRepository.create({
                nickname: adminNickname,
                name: process.env.DEFAULT_ADMIN_NAME ?? 'Aivacol Admin',
                email: adminEmail,
                passwordHash: await bcrypt.hash(
                    process.env.DEFAULT_ADMIN_PASSWORD ?? 'aivacol123',
                    10,
                ),
            });
            await usersRepository.save(admin);
        }

        const brandsByName = new Map<string, Brand>();

        for (const name of seedBrands) {
            let brand = await brandsRepository.findOne({ where: { name } });

            if (!brand) {
                brand = await brandsRepository.save(
                    brandsRepository.create({
                        name,
                        createdById: admin.id,
                    }),
                );
            }

            brandsByName.set(name, brand);
        }

        for (const seedModel of seedModels) {
            const brand = brandsByName.get(seedModel.brand);

            if (!brand) {
                continue;
            }

            const existingModel = await modelsRepository.findOne({
                where: {
                    name: seedModel.name,
                    brandId: brand.id,
                },
            });

            if (!existingModel) {
                await modelsRepository.save(
                    modelsRepository.create({
                        name: seedModel.name,
                        brandId: brand.id,
                        createdById: admin.id,
                    }),
                );
            }
        }

        for (const seedVehicle of await readSeedVehicles()) {
            const licensePlate = seedVehicle.licensePlate.toUpperCase();
            const existingVehicle = await vehiclesRepository.findOne({
                where: { licensePlate },
            });

            if (existingVehicle) {
                continue;
            }

            let brand = brandsByName.get(seedVehicle.brand);

            if (!brand) {
                brand = await brandsRepository.save(
                    brandsRepository.create({
                        name: seedVehicle.brand,
                        createdById: admin.id,
                    }),
                );
                brandsByName.set(seedVehicle.brand, brand);
            }

            let model = await modelsRepository.findOne({
                where: {
                    name: seedVehicle.model,
                    brandId: brand.id,
                },
            });

            if (!model) {
                model = await modelsRepository.save(
                    modelsRepository.create({
                        name: seedVehicle.model,
                        brandId: brand.id,
                        createdById: admin.id,
                    }),
                );
            }

            await vehiclesRepository.save(
                vehiclesRepository.create({
                    licensePlate,
                    chassis: seedVehicle.chassis,
                    renavam: seedVehicle.renavam,
                    year: seedVehicle.year,
                    modelId: model.id,
                    createdById: admin.id,
                }),
            );
        }
    } finally {
        await dataSource.destroy();
    }
}

void seed();
