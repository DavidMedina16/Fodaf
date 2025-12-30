import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum InvestmentStatus {
  ACTIVE = 'Activa',
  FINISHED = 'Finalizada',
}

@Entity('investments')
export class Investment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'bank_name', length: 255, nullable: true })
  bankName: string;

  @Column({
    name: 'amount_invested',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  amountInvested: number;

  @Column({
    name: 'expected_return',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  expectedReturn: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ length: 50, nullable: true })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
