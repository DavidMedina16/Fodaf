import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from '../../entities/loan.entity';
import { LoanInstallment } from '../../entities/loan-installment.entity';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { LoanInstallmentsService } from './loan-installments.service';
import { LoanInstallmentsController } from './loan-installments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, LoanInstallment])],
  controllers: [LoansController, LoanInstallmentsController],
  providers: [LoansService, LoanInstallmentsService],
  exports: [LoansService, LoanInstallmentsService],
})
export class LoansModule {}
