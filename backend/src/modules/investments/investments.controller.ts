import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { InvestmentsService, InvestmentsFilterDto } from './investments.service';
import { CreateInvestmentDto, UpdateInvestmentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  create(@Body() createInvestmentDto: CreateInvestmentDto) {
    return this.investmentsService.create(createInvestmentDto);
  }

  @Get()
  findAll(@Query() filters: InvestmentsFilterDto) {
    return this.investmentsService.findAll(filters);
  }

  @Get('summary')
  getSummary() {
    return this.investmentsService.getSummary();
  }

  @Get('simulate')
  simulate(
    @Query('amountInvested') amountInvested: string,
    @Query('interestRate') interestRate: string,
    @Query('termDays') termDays: string,
  ) {
    return this.investmentsService.simulate(
      parseFloat(amountInvested),
      parseFloat(interestRate),
      parseInt(termDays, 10),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.investmentsService.findOne(id);
  }

  @Get(':id/details')
  findOneWithCalculations(@Param('id', ParseIntPipe) id: number) {
    return this.investmentsService.findOneWithCalculations(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInvestmentDto: UpdateInvestmentDto,
  ) {
    return this.investmentsService.update(id, updateInvestmentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.investmentsService.remove(id);
  }

  @Post(':id/finish')
  finish(@Param('id', ParseIntPipe) id: number) {
    return this.investmentsService.finish(id);
  }

  @Post(':id/renew')
  renew(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { termDays?: number; interestRate?: number; reinvestReturns?: boolean },
  ) {
    return this.investmentsService.renew(
      id,
      body.termDays,
      body.interestRate,
      body.reinvestReturns ?? true,
    );
  }

  @Post('update-expired')
  updateExpired() {
    return this.investmentsService.updateExpiredInvestments();
  }
}
