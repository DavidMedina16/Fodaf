import { Routes } from '@angular/router';

export const FINES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./fines-list/fines-list.component').then(m => m.FinesListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./fine-form/fine-form.component').then(m => m.FineFormComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./fine-form/fine-form.component').then(m => m.FineFormComponent)
  }
];
