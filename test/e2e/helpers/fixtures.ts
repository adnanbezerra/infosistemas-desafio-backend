import type { AuthenticatedUser } from '../../../src/modules/auth/interfaces/authenticated-user.interface';

export const authToken = 'jwt-token';

export const authenticatedUser: AuthenticatedUser = {
    id: '44444444-4444-4444-8444-444444444444',
    nickname: 'aivacol',
    name: 'Aivacol Admin',
    email: 'aivacol@example.com',
};

export const brandId = '11111111-1111-4111-8111-111111111111';
export const modelId = '22222222-2222-4222-8222-222222222222';
export const vehicleId = '33333333-3333-4333-8333-333333333333';

export const brandPayload = {
    name: 'Toyota',
};

export const modelPayload = {
    name: 'Corolla',
    brand_id: brandId,
};

export const vehiclePayload = {
    license_plate: 'ABC1D23',
    chassis: 'CHASSIS123',
    renavam: '123456789',
    year: 2024,
    model_id: modelId,
};

export const brandResponse = {
    id: brandId,
    name: 'Toyota',
    createdById: authenticatedUser.id,
};

export const modelResponse = {
    id: modelId,
    name: 'Corolla',
    brandId,
    createdById: authenticatedUser.id,
};

export const vehicleResponse = {
    id: vehicleId,
    licensePlate: 'ABC1D23',
    chassis: 'CHASSIS123',
    renavam: '123456789',
    year: 2024,
    modelId,
    createdById: authenticatedUser.id,
};

export function paginatedResponse<T>(data: T[]) {
    return {
        data,
        meta: {
            page: 1,
            limit: 10,
            total: data.length,
            totalPages: data.length > 0 ? 1 : 0,
        },
    };
}
