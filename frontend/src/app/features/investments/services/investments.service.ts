import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  Investment,
  InvestmentWithCalculations,
  CreateInvestmentRequest,
  UpdateInvestmentRequest,
  InvestmentSimulation,
  InvestmentsSummary,
  PaginatedInvestments,
  InvestmentsFilter,
  RenewInvestmentRequest,
} from '@core/models/investment.model';

@Injectable({
  providedIn: 'root',
})
export class InvestmentsService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/investments';

  getInvestments(filters?: InvestmentsFilter): Observable<PaginatedInvestments> {
    return this.api.get<PaginatedInvestments>(this.endpoint, filters as Record<string, unknown>);
  }

  getInvestment(id: number): Observable<Investment> {
    return this.api.get<Investment>(`${this.endpoint}/${id}`);
  }

  getInvestmentWithDetails(id: number): Observable<InvestmentWithCalculations> {
    return this.api.get<InvestmentWithCalculations>(`${this.endpoint}/${id}/details`);
  }

  createInvestment(data: CreateInvestmentRequest): Observable<Investment> {
    return this.api.post<Investment>(this.endpoint, data);
  }

  updateInvestment(id: number, data: UpdateInvestmentRequest): Observable<Investment> {
    return this.api.patch<Investment>(`${this.endpoint}/${id}`, data);
  }

  deleteInvestment(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  finishInvestment(id: number): Observable<Investment> {
    return this.api.post<Investment>(`${this.endpoint}/${id}/finish`, {});
  }

  renewInvestment(id: number, data?: RenewInvestmentRequest): Observable<Investment> {
    return this.api.post<Investment>(`${this.endpoint}/${id}/renew`, data || {});
  }

  getSummary(): Observable<InvestmentsSummary> {
    return this.api.get<InvestmentsSummary>(`${this.endpoint}/summary`);
  }

  simulate(amountInvested: number, interestRate: number, termDays: number): Observable<InvestmentSimulation> {
    return this.api.get<InvestmentSimulation>(`${this.endpoint}/simulate`, {
      amountInvested,
      interestRate,
      termDays,
    });
  }

  updateExpiredInvestments(): Observable<number> {
    return this.api.post<number>(`${this.endpoint}/update-expired`, {});
  }
}
