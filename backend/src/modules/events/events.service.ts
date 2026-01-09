import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus } from '../../entities/event.entity';
import { EventTransaction, TransactionType } from '../../entities/event-transaction.entity';
import { CreateEventDto, UpdateEventDto } from './dto';

export interface EventsFilterDto {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedEvents {
  data: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  goalProgress: number;
  transactionsCount: number;
}

export interface EventWithSummary extends Event {
  summary: EventSummary;
}

export interface EventsSummary {
  totalEvents: number;
  plannedEvents: number;
  activeEvents: number;
  finishedEvents: number;
  totalRaised: number;
  totalGoal: number;
  upcomingEvents: Event[];
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventTransaction)
    private readonly transactionRepository: Repository<EventTransaction>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      status: createEventDto.status || EventStatus.PLANNED,
    });
    return this.eventRepository.save(event);
  }

  async findAll(filters: EventsFilterDto = {}): Promise<PaginatedEvents> {
    const { status, search, dateFrom, dateTo, page = 1, limit = 10 } = filters;

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.transactions', 'transactions');

    if (status) {
      queryBuilder.andWhere('event.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(event.name LIKE :search OR event.description LIKE :search OR event.location LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (dateFrom) {
      queryBuilder.andWhere('event.eventDate >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('event.eventDate <= :dateTo', { dateTo });
    }

    queryBuilder.orderBy('event.eventDate', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['transactions', 'transactions.creator'],
    });

    if (!event) {
      throw new NotFoundException(`Evento #${id} no encontrado`);
    }

    return event;
  }

  async findOneWithSummary(id: number): Promise<EventWithSummary> {
    const event = await this.findOne(id);
    const summary = this.calculateEventSummary(event);

    return {
      ...event,
      summary,
    };
  }

  async update(id: number, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    Object.assign(event, updateEventDto);
    return this.eventRepository.save(event);
  }

  async remove(id: number): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
  }

  async changeStatus(id: number, status: EventStatus): Promise<Event> {
    const event = await this.findOne(id);
    event.status = status;
    return this.eventRepository.save(event);
  }

  async getSummary(): Promise<EventsSummary> {
    const events = await this.eventRepository.find({
      relations: ['transactions'],
    });

    const plannedEvents = events.filter((e) => e.status === EventStatus.PLANNED);
    const activeEvents = events.filter((e) => e.status === EventStatus.ACTIVE);
    const finishedEvents = events.filter((e) => e.status === EventStatus.FINISHED);

    let totalRaised = 0;
    let totalGoal = 0;

    for (const event of events) {
      totalGoal += Number(event.fundraisingGoal) || 0;
      const summary = this.calculateEventSummary(event);
      totalRaised += summary.netAmount;
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingEvents = events
      .filter((e) => {
        const eventDate = new Date(e.eventDate);
        return (
          eventDate >= today &&
          eventDate <= thirtyDaysFromNow &&
          (e.status === EventStatus.PLANNED || e.status === EventStatus.ACTIVE)
        );
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 5);

    return {
      totalEvents: events.length,
      plannedEvents: plannedEvents.length,
      activeEvents: activeEvents.length,
      finishedEvents: finishedEvents.length,
      totalRaised: Math.round(totalRaised * 100) / 100,
      totalGoal: Math.round(totalGoal * 100) / 100,
      upcomingEvents,
    };
  }

  private calculateEventSummary(event: Event): EventSummary {
    const transactions = event.transactions || [];

    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netAmount = totalIncome - totalExpenses;
    const goal = Number(event.fundraisingGoal) || 0;
    const goalProgress = goal > 0 ? Math.min(100, Math.round((netAmount / goal) * 100)) : 0;

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      goalProgress,
      transactionsCount: transactions.length,
    };
  }
}
