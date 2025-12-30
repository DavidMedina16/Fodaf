import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../../entities/event.entity';
import { EventTransaction } from '../../entities/event-transaction.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventTransactionsService } from './event-transactions.service';
import { EventTransactionsController } from './event-transactions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventTransaction])],
  controllers: [EventsController, EventTransactionsController],
  providers: [EventsService, EventTransactionsService],
  exports: [EventsService, EventTransactionsService],
})
export class EventsModule {}
