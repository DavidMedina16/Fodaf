import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../../entities/user.entity';
import { Contribution } from '../../entities/contribution.entity';
import { Loan } from '../../entities/loan.entity';
import { Fine } from '../../entities/fine.entity';
import { Investment } from '../../entities/investment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Contribution, Loan, Fine, Investment]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
