import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  FundStatusReport,
  DelinquencyReport,
  LoansReport,
  ContributionsReport,
  ExportData,
} from '@core/models/report.model';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/reports';

  getFundStatus(): Observable<FundStatusReport> {
    return this.api.get<FundStatusReport>(`${this.endpoint}/fund-status`);
  }

  getDelinquencyReport(): Observable<DelinquencyReport> {
    return this.api.get<DelinquencyReport>(`${this.endpoint}/delinquency`);
  }

  getLoansReport(): Observable<LoansReport> {
    return this.api.get<LoansReport>(`${this.endpoint}/loans`);
  }

  getContributionsReport(year?: number): Observable<ContributionsReport> {
    const params = year ? { year: year.toString() } : {};
    return this.api.get<ContributionsReport>(
      `${this.endpoint}/contributions`,
      params
    );
  }

  getExportData(): Observable<ExportData> {
    return this.api.get<ExportData>(`${this.endpoint}/export`);
  }
}
