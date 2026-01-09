import { Routes } from '@angular/router';

export const EVENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./events-list/events-list.component').then(m => m.EventsListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./event-form/event-form.component').then(m => m.EventFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./event-detail/event-detail.component').then(m => m.EventDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./event-form/event-form.component').then(m => m.EventFormComponent)
  }
];
