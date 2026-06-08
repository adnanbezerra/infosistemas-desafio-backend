import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Model } from '../models/model.entity';
import { User } from '../users/user.entity';

@Entity('vehicles')
export class Vehicle {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'license_plate', unique: true })
    licensePlate: string;

    @Column({ unique: true })
    chassis: string;

    @Column({ unique: true })
    renavam: string;

    @Column({ type: 'int' })
    year: number;

    @Column({ name: 'model_id', type: 'uniqueidentifier' })
    modelId: string;

    @ManyToOne(() => Model, (model) => model.vehicles, { nullable: false })
    @JoinColumn({ name: 'model_id' })
    model: Model;

    @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
    updatedAt: Date;

    @Column({ name: 'created_by', type: 'uniqueidentifier' })
    createdById: string;

    @ManyToOne(() => User, (user) => user.vehicles, { nullable: false })
    @JoinColumn({ name: 'created_by' })
    createdBy: User;
}
