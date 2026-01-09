import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InvestmentStatus {
  ACTIVE = 'Activa',
  FINISHED = 'Finalizada',
  RENEWED = 'Renovada',
}

@Entity('investments')
export class Investment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'bank_name', length: 255 })
  bankName: string;

  @Column({
    name: 'amount_invested',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  amountInvested: number;

  @Column({
    name: 'interest_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    comment: 'Tasa de interés anual en porcentaje',
  })
  interestRate: number;

  @Column({
    name: 'term_days',
    type: 'int',
    comment: 'Plazo en días del CDT',
  })
  termDays: number;

  @Column({
    name: 'expected_return',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'Rendimiento esperado calculado automáticamente',
  })
  expectedReturn: number;

  @Column({
    name: 'total_at_maturity',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'Monto total al vencimiento (capital + intereses)',
  })
  totalAtMaturity: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: InvestmentStatus,
    default: InvestmentStatus.ACTIVE,
  })
  status: InvestmentStatus;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
