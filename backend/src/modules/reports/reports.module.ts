import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Contribution } from '../../entities/contribution.entity';
import { Loan } from '../../entities/loan.entity';
import { LoanInstallment } from '../../entities/loan-installment.entity';
import { Investment } from '../../entities/investment.entity';
import { Fine } from '../../entities/fine.entity';
import { User } from '../../entities/user.entity';
import { Event } from '../../entities/event.entity';
import { EventTransaction } from '../../entities/event-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contribution,
      Loan,
      LoanInstallment,
      Investment,
      Fine,
      User,
      Event,
      EventTransaction,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
