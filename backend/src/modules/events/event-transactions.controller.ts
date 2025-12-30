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
import { EventTransactionsService } from './event-transactions.service';
import { CreateEventTransactionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('event-transactions')
export class EventTransactionsController {
  constructor(
    private readonly transactionsService: EventTransactionsService,
  ) {}

  @Post()
  create(
    @Body() createTransactionDto: CreateEventTransactionDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.transactionsService.create(createTransactionDto, req.user.id);
  }

  @Get('event/:eventId')
  findByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.transactionsService.findByEvent(eventId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.remove(id);
  }
}
