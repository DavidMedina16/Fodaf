import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { LoansService, LoansFilterDto } from './loans.service';
import { CreateLoanDto, UpdateLoanDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  create(
    @Body() createLoanDto: CreateLoanDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.loansService.create(createLoanDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: LoansFilterDto = {
      userId: userId ? parseInt(userId, 10) : undefined,
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    return this.loansService.findAll(filters);
  }

  @Get('summary')
  getSummary() {
    return this.loansService.getSummary();
  }

  @Get('simulate')
  simulate(
    @Query('amount') amount: string,
    @Query('interestRate') interestRate: string,
    @Query('termMonths') termMonths: string,
  ) {
    return this.loansService.simulate(
      parseFloat(amount),
      parseFloat(interestRate),
      parseInt(termMonths, 10),
    );
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.loansService.findByUser(userId);
  }

  @Get('user/:userId/credit-limit')
  getCreditLimit(@Param('userId', ParseIntPipe) userId: number) {
    return this.loansService.getCreditLimit(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.findOne(id);
  }

  @Get(':id/amortization')
  getAmortizationSchedule(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.getAmortizationSchedule(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLoanDto: UpdateLoanDto,
  ) {
    return this.loansService.update(id, updateLoanDto);
  }

  @Post(':id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.loansService.approve(id, req.user.id);
  }

  @Post(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.loansService.reject(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.remove(id);
  }
}
