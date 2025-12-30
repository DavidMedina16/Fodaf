import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LoanInstallmentsService } from './loan-installments.service';
import { CreateLoanInstallmentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('loan-installments')
export class LoanInstallmentsController {
  constructor(
    private readonly installmentsService: LoanInstallmentsService,
  ) {}

  @Post()
  create(
    @Body() createInstallmentDto: CreateLoanInstallmentDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.installmentsService.create(createInstallmentDto, req.user.id);
  }

  @Get('loan/:loanId')
  findByLoan(@Param('loanId', ParseIntPipe) loanId: number) {
    return this.installmentsService.findByLoan(loanId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.installmentsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.installmentsService.remove(id);
  }
}
