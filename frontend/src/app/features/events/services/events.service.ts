import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  Event,
  EventWithSummary,
  EventsSummary,
  PaginatedEvents,
  EventsFilter,
  CreateEventDto,
  UpdateEventDto,
  EventStatus,
  EventTransaction,
  CreateTransactionDto,
} from '@core/models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/events';

  getEvents(filters?: EventsFilter): Observable<PaginatedEvents> {
    return this.api.get<PaginatedEvents>(this.endpoint, filters as Record<string, unknown>);
  }

  getEvent(id: number): Observable<Event> {
    return this.api.get<Event>(`${this.endpoint}/${id}`);
  }

  getEventWithDetails(id: number): Observable<EventWithSummary> {
    return this.api.get<EventWithSummary>(`${this.endpoint}/${id}/details`);
  }

  createEvent(data: CreateEventDto): Observable<Event> {
    return this.api.post<Event>(this.endpoint, data);
  }

  updateEvent(id: number, data: UpdateEventDto): Observable<Event> {
    return this.api.patch<Event>(`${this.endpoint}/${id}`, data);
  }

  deleteEvent(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  changeStatus(id: number, status: EventStatus): Observable<Event> {
    return this.api.patch<Event>(`${this.endpoint}/${id}/status`, { status });
  }

  getSummary(): Observable<EventsSummary> {
    return this.api.get<EventsSummary>(`${this.endpoint}/summary`);
  }

  // Event Transactions
  getTransactions(eventId: number): Observable<EventTransaction[]> {
    return this.api.get<EventTransaction[]>(`${this.endpoint}/${eventId}/transactions`);
  }

  createTransaction(data: CreateTransactionDto): Observable<EventTransaction> {
    return this.api.post<EventTransaction>(`/event-transactions`, data);
  }

  deleteTransaction(transactionId: number): Observable<void> {
    return this.api.delete<void>(`/event-transactions/${transactionId}`);
  }
}
