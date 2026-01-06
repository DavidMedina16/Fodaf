import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, EmptyStateComponent } from '@shared/components';

@Component({
  selector: 'app-investments-list',
  standalone: true,
  imports: [CommonModule, CardComponent, EmptyStateComponent],
  template: `
    <div class="page">
      <header class="page__header">
        <h1 class="page__title">Inversiones</h1>
        <p class="page__subtitle">CDTs y otras inversiones del fondo</p>
      </header>
      <app-card>
        <app-empty-state
          icon="folder"
          title="Módulo en desarrollo"
          description="Este módulo será implementado en el próximo sprint."
        ></app-empty-state>
      </app-card>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    .page {
      &__header { margin-bottom: $spacing-6; }
      &__title { font-size: $font-size-2xl; font-weight: 700; margin: 0 0 $spacing-1; }
      &__subtitle { font-size: $font-size-sm; color: $text-secondary; margin: 0; }
    }
  `]
})
export class InvestmentsListComponent {}
