import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  Fine,
  FinesSummary,
  UserFinesSummary,
  PaginatedFines,
  FinesFilter,
  CreateFineDto,
  UpdateFineDto,
} from '@core/models/fine.model';

@Injectable({
  providedIn: 'root',
})
export class FinesService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/fines';

  getFines(filters?: FinesFilter): Observable<PaginatedFines> {
    return this.api.get<PaginatedFines>(this.endpoint, filters as Record<string, unknown>);
  }

  getFine(id: number): Observable<Fine> {
    return this.api.get<Fine>(`${this.endpoint}/${id}`);
  }

  createFine(data: CreateFineDto): Observable<Fine> {
    return this.api.post<Fine>(this.endpoint, data);
  }

  updateFine(id: number, data: UpdateFineDto): Observable<Fine> {
    return this.api.patch<Fine>(`${this.endpoint}/${id}`, data);
  }

  deleteFine(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  markAsPaid(id: number): Observable<Fine> {
    return this.api.patch<Fine>(`${this.endpoint}/${id}/pay`, {});
  }

  getSummary(): Observable<FinesSummary> {
    return this.api.get<FinesSummary>(`${this.endpoint}/summary`);
  }

  getUserFines(userId: number): Observable<Fine[]> {
    return this.api.get<Fine[]>(`${this.endpoint}/user/${userId}`);
  }

  getUserFinesSummary(userId: number): Observable<UserFinesSummary> {
    return this.api.get<UserFinesSummary>(`${this.endpoint}/user/${userId}/summary`);
  }
}
