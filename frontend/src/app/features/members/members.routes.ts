import { Routes } from '@angular/router';

export const MEMBERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./members-list/members-list.component').then(m => m.MembersListComponent)
  }
];
