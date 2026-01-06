import { Routes } from '@angular/router';

export const INVESTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./investments-list/investments-list.component').then(m => m.InvestmentsListComponent)
  }
];
