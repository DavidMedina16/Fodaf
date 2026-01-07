import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Role } from '@core/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/roles';

  getRoles(): Observable<Role[]> {
    return this.api.get<Role[]>(this.endpoint);
  }

  getRole(id: number): Observable<Role> {
    return this.api.get<Role>(`${this.endpoint}/${id}`);
  }
}
