import { BadRequestException } from '@nestjs/common';

export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type Paginated<T> = {
    data: T[];
    meta: PaginationMeta;
};

export type PaginationQuery = {
    page?: string;
    limit?: string;
    search?: string;
};

export function getPagination(query: PaginationQuery) {
    const page = parsePositiveInteger(query.page, 'page', 1);
    const limit = parsePositiveInteger(query.limit, 'limit', 10);

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
}

export function getPaginationMeta(
    page: number,
    limit: number,
    total: number,
): PaginationMeta {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
}

function parsePositiveInteger(
    value: string | undefined,
    field: string,
    fallback: number,
) {
    if (value === undefined) {
        return fallback;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new BadRequestException(`${field} must be a positive integer`);
    }

    return parsed;
}
