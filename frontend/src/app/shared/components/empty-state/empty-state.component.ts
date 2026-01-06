import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  icon = input<'search' | 'folder' | 'users' | 'document' | 'error'>('folder');
  title = input<string>('No hay datos');
  description = input<string>('');
  actionText = input<string>('');

  actionClick = output<void>();

  onActionClick(): void {
    this.actionClick.emit();
  }
}
