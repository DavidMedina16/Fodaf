import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { User, CreateUserRequest, UpdateUserRequest } from '@core/models/user.model';
import { PaginatedResponse, PaginationParams } from '@core/models/api-response.model';

export interface MemberFilters extends PaginationParams {
  search?: string;
  email?: string;
  isActive?: boolean;
  roleId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class MembersService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/users';

  getMembers(filters?: MemberFilters): Observable<PaginatedResponse<User>> {
    return this.api.get<PaginatedResponse<User>>(this.endpoint, filters as Record<string, unknown>);
  }

  getMember(id: number): Observable<User> {
    return this.api.get<User>(`${this.endpoint}/${id}`);
  }

  createMember(data: CreateUserRequest): Observable<User> {
    return this.api.post<User>(this.endpoint, data);
  }

  updateMember(id: number, data: UpdateUserRequest): Observable<User> {
    return this.api.patch<User>(`${this.endpoint}/${id}`, data);
  }

  deleteMember(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
