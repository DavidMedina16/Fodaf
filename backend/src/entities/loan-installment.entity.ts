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

@Entity('loan_installments')
export class LoanInstallment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'loan_id' })
  loanId: number;

  @Column({
    name: 'amount_capital',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  amountCapital: number;

  @Column({
    name: 'amount_interest',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  amountInterest: number;

  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate: Date;

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
