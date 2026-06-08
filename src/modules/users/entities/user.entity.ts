import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Brand } from '../../brands/entities/brand.entity';
import { Model } from '../../models/entities/model.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    nickname: string;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ name: 'password_hash' })
    passwordHash: string;

    @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
    updatedAt: Date;

    @OneToMany(() => Brand, (brand) => brand.createdBy)
    brands: Brand[];

    @OneToMany(() => Model, (model) => model.createdBy)
    models: Model[];

    @OneToMany(() => Vehicle, (vehicle) => vehicle.createdBy)
    vehicles: Vehicle[];
}
