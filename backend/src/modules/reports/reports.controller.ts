import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('fund-status')
  getFundStatus() {
    return this.reportsService.getFundStatus();
  }

  @Get('delinquency')
  getDelinquencyReport() {
    return this.reportsService.getDelinquencyReport();
  }

  @Get('loans')
  getLoansReport() {
    return this.reportsService.getLoansReport();
  }

  @Get('contributions')
  getContributionsReport(@Query('year') year?: string) {
    const yearNumber = year ? parseInt(year, 10) : undefined;
    return this.reportsService.getContributionsReport(yearNumber);
  }

  @Get('export')
  getExportData() {
    return this.reportsService.getExportData();
  }
}
