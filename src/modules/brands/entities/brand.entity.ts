import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Model } from '../../models/entities/model.entity';
import { User } from '../../users/entities/user.entity';

@Entity('brands')
export class Brand {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
    updatedAt: Date;

    @Column({ name: 'created_by', type: 'uniqueidentifier' })
    createdById: string;

    @ManyToOne(() => User, (user) => user.brands, { nullable: false })
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @OneToMany(() => Model, (model) => model.brand)
    models: Model[];
}
