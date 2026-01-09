import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EventTransaction } from './event-transaction.entity';

export enum EventStatus {
  PLANNED = 'Planificado',
  ACTIVE = 'Activo',
  FINISHED = 'Finalizado',
  CANCELLED = 'Cancelado',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'event_date', type: 'date' })
  eventDate: Date;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({
    name: 'fundraising_goal',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  fundraisingGoal: number;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PLANNED,
  })
  status: EventStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => EventTransaction, (transaction) => transaction.event)
  transactions: EventTransaction[];
}
