import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from '../../entities/loan.entity';
import { LoanInstallment } from '../../entities/loan-installment.entity';
import { Contribution } from '../../entities/contribution.entity';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { LoanInstallmentsService } from './loan-installments.service';
import { LoanInstallmentsController } from './loan-installments.controller';
import { LoanCalculationService } from './loan-calculation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, LoanInstallment, Contribution])],
  controllers: [LoansController, LoanInstallmentsController],
  providers: [LoansService, LoanInstallmentsService, LoanCalculationService],
  exports: [LoansService, LoanInstallmentsService, LoanCalculationService],
})
export class LoansModule {}
