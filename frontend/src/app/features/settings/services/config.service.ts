import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  AppConfig,
  BulkUpdateConfigRequest,
  BulkUpdateConfigResponse,
  SystemConfig,
  SystemConfigByCategory,
} from '@core/models/config.model';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/config';

  getAll(): Observable<AppConfig[]> {
    return this.api.get<AppConfig[]>(this.endpoint);
  }

  getSystemConfig(): Observable<SystemConfig> {
    return this.api.get<SystemConfig>(`${this.endpoint}/system`);
  }

  getSystemConfigByCategory(): Observable<SystemConfigByCategory> {
    return this.api.get<SystemConfigByCategory>(
      `${this.endpoint}/system/by-category`
    );
  }

  getByKey(key: string): Observable<AppConfig> {
    return this.api.get<AppConfig>(`${this.endpoint}/key/${key}`);
  }

  updateByKey(key: string, value: string): Observable<AppConfig> {
    return this.api.patch<AppConfig>(`${this.endpoint}/key/${key}`, { value });
  }

  bulkUpdate(data: BulkUpdateConfigRequest): Observable<BulkUpdateConfigResponse> {
    return this.api.patch<BulkUpdateConfigResponse>(
      `${this.endpoint}/system`,
      data
    );
  }

  getById(id: number): Observable<AppConfig> {
    return this.api.get<AppConfig>(`${this.endpoint}/${id}`);
  }

  update(id: number, data: Partial<AppConfig>): Observable<AppConfig> {
    return this.api.patch<AppConfig>(`${this.endpoint}/${id}`, data);
  }
}
