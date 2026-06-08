import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Brand } from '../../brands/entities/brand.entity';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('models')
@Index('UQ_models_name_with_brand', ['name', 'brandId'], {
    unique: true,
    where: 'brand_id IS NOT NULL',
})
@Index('UQ_models_name_without_brand', ['name'], {
    unique: true,
    where: 'brand_id IS NULL',
})
export class Model {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ name: 'brand_id', type: 'uniqueidentifier', nullable: true })
    brandId: string | null;

    @ManyToOne(() => Brand, (brand) => brand.models, { nullable: true })
    @JoinColumn({ name: 'brand_id' })
    brand: Brand | null;

    @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
    updatedAt: Date;

    @Column({ name: 'created_by', type: 'uniqueidentifier' })
    createdById: string;

    @ManyToOne(() => User, (user) => user.models, { nullable: false })
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @OneToMany(() => Vehicle, (vehicle) => vehicle.model)
    vehicles: Vehicle[];
}
