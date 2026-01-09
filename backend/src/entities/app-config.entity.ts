import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ConfigType {
  NUMBER = 'number',
  PERCENTAGE = 'percentage',
  CURRENCY = 'currency',
  TEXT = 'text',
  DATE = 'date',
}

export enum ConfigCategory {
  GENERAL = 'general',
  PAYMENTS = 'payments',
  LOANS = 'loans',
  FINES = 'fines',
  INVESTMENTS = 'investments',
}

@Entity('app_config')
export class AppConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  key: string;

  @Column({ length: 255, nullable: true })
  value: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ConfigType, default: ConfigType.TEXT })
  type: ConfigType;

  @Column({ type: 'enum', enum: ConfigCategory, default: ConfigCategory.GENERAL })
  category: ConfigCategory;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
