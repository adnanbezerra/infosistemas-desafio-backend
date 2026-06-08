import { BadRequestException } from '@nestjs/common';

export function validateName(value: unknown): string {
    if (typeof value !== 'string') {
        throw new BadRequestException('name must be a string');
    }

    const name = value.trim();

    if (name.length < 2 || name.length > 120) {
        throw new BadRequestException('name must be between 2 and 120 chars');
    }

    return name;
}
