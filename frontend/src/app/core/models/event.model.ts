import { User } from './user.model';
import { TransactionType } from './enums';

export { TransactionType };

export enum EventStatus {
  PLANNED = 'Planificado',
  ACTIVE = 'Activo',
  FINISHED = 'Finalizado',
  CANCELLED = 'Cancelado',
}

export interface EventTransaction {
  id: number;
  eventId: number;
  amount: number;
  type: TransactionType | string;
  description?: string;
  createdBy?: number;
  createdAt: string;
  creator?: User;
}

export interface Event {
  id: number;
  name: string;
  description?: string;
  eventDate: string;
  location?: string;
  fundraisingGoal: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  transactions?: EventTransaction[];
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

export interface EventsFilter {
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

export interface CreateEventDto {
  name: string;
  description?: string;
  eventDate: string;
  location?: string;
  fundraisingGoal?: number;
  status?: EventStatus;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

export interface CreateTransactionDto {
  eventId: number;
  amount: number;
  type: TransactionType | string;
  description?: string;
}
