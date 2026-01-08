import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  Contribution,
  CreateContributionRequest,
  UpdateContributionRequest,
  MonthlySummary,
  YearlySummary,
  UserContributionStatus,
} from '@core/models/contribution.model';
import { PaginatedResponse, PaginationParams } from '@core/models/api-response.model';

export interface ContributionFilters extends PaginationParams {
  userId?: number;
  targetMonth?: string;
  year?: number;
  month?: number;
  status?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContributionsService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/contributions';

  getContributions(filters?: ContributionFilters): Observable<PaginatedResponse<Contribution>> {
    return this.api.get<PaginatedResponse<Contribution>>(this.endpoint, filters as Record<string, unknown>);
  }

  getContribution(id: number): Observable<Contribution> {
    return this.api.get<Contribution>(`${this.endpoint}/${id}`);
  }

  getContributionsByUser(userId: number): Observable<Contribution[]> {
    return this.api.get<Contribution[]>(`${this.endpoint}/user/${userId}`);
  }

  createContribution(data: CreateContributionRequest): Observable<Contribution> {
    return this.api.post<Contribution>(this.endpoint, data);
  }

  updateContribution(id: number, data: UpdateContributionRequest): Observable<Contribution> {
    return this.api.patch<Contribution>(`${this.endpoint}/${id}`, data);
  }

  deleteContribution(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  getMonthlySummary(targetMonth: string): Observable<MonthlySummary> {
    return this.api.get<MonthlySummary>(`${this.endpoint}/summary/monthly/${targetMonth}`);
  }

  getYearlySummary(year: number): Observable<YearlySummary> {
    return this.api.get<YearlySummary>(`${this.endpoint}/summary/yearly/${year}`);
  }

  getUserYearStatus(userId: number, year: number): Observable<UserContributionStatus[]> {
    return this.api.get<UserContributionStatus[]>(`${this.endpoint}/user/${userId}/status/${year}`);
  }

  markOverdueContributions(): Observable<number> {
    return this.api.post<number>(`${this.endpoint}/mark-overdue`, {});
  }
}
