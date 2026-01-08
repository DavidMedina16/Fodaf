import { Routes } from '@angular/router';

export const LOANS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./loans-list/loans-list.component').then(m => m.LoansListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./loan-request/loan-request.component').then(m => m.LoanRequestComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./loan-detail/loan-detail.component').then(m => m.LoanDetailComponent)
  }
];
