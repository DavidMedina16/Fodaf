import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum FineStatus {
  PENDING = 'Pendiente',
  PAID = 'Pagada',
}

export enum FineCategory {
  LATE_PAYMENT = 'Mora',
  ABSENCE = 'Inasistencia',
  RULE_VIOLATION = 'Incumplimiento',
  OTHER = 'Otro',
}

@Entity('fines')
export class Fine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({
    type: 'enum',
    enum: FineCategory,
    default: FineCategory.OTHER,
  })
  category: FineCategory;

  @Column({
    type: 'enum',
    enum: FineStatus,
    default: FineStatus.PENDING,
  })
  status: FineStatus;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.fines)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
