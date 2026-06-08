import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    findByNickname(nickname: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { nickname } });
    }

    findById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }
}
