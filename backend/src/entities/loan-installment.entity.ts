import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Loan } from './loan.entity';
import { User } from './user.entity';

export enum InstallmentStatus {
  PENDING = 'Pendiente',
  PAID = 'Pagado',
  OVERDUE = 'Vencido',
}

@Entity('loan_installments')
export class LoanInstallment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'loan_id' })
  loanId: number;

  @Column({ name: 'installment_number', type: 'int' })
  installmentNumber: number;

  @Column({
    name: 'amount_capital',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  amountCapital: number;

  @Column({
    name: 'amount_interest',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  amountInterest: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  totalAmount: number;

  @Column({
    name: 'remaining_balance',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  remainingBalance: number;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate: Date;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 50,
    default: InstallmentStatus.PENDING,
  })
  status: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Loan, (loan) => loan.installments)
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
