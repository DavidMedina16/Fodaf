import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  Loan,
  CreateLoanRequest,
  UpdateLoanRequest,
  LoanCalculation,
  CreditLimitInfo,
  LoansSummary,
  PaginatedLoans,
  LoansFilter,
} from '@core/models/loan.model';

@Injectable({
  providedIn: 'root',
})
export class LoansService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/loans';

  getLoans(filters?: LoansFilter): Observable<PaginatedLoans> {
    return this.api.get<PaginatedLoans>(this.endpoint, filters as Record<string, unknown>);
  }

  getLoan(id: number): Observable<Loan> {
    return this.api.get<Loan>(`${this.endpoint}/${id}`);
  }

  getLoansByUser(userId: number): Observable<Loan[]> {
    return this.api.get<Loan[]>(`${this.endpoint}/user/${userId}`);
  }

  createLoan(data: CreateLoanRequest): Observable<Loan> {
    return this.api.post<Loan>(this.endpoint, data);
  }

  updateLoan(id: number, data: UpdateLoanRequest): Observable<Loan> {
    return this.api.patch<Loan>(`${this.endpoint}/${id}`, data);
  }

  deleteLoan(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  approveLoan(id: number): Observable<Loan> {
    return this.api.post<Loan>(`${this.endpoint}/${id}/approve`, {});
  }

  rejectLoan(id: number): Observable<Loan> {
    return this.api.post<Loan>(`${this.endpoint}/${id}/reject`, {});
  }

  getAmortizationSchedule(id: number): Observable<LoanCalculation> {
    return this.api.get<LoanCalculation>(`${this.endpoint}/${id}/amortization`);
  }

  simulateLoan(amount: number, interestRate: number, termMonths: number): Observable<LoanCalculation> {
    return this.api.get<LoanCalculation>(`${this.endpoint}/simulate`, {
      amount,
      interestRate,
      termMonths,
    });
  }

  getCreditLimit(userId: number): Observable<CreditLimitInfo> {
    return this.api.get<CreditLimitInfo>(`${this.endpoint}/user/${userId}/credit-limit`);
  }

  getSummary(): Observable<LoansSummary> {
    return this.api.get<LoansSummary>(`${this.endpoint}/summary`);
  }
}
