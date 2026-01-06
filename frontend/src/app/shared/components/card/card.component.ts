import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  title = input<string>('');
  subtitle = input<string>('');
  padding = input<'none' | 'sm' | 'md' | 'lg'>('md');
  elevated = input<boolean>(false);
  bordered = input<boolean>(false);
  clickable = input<boolean>(false);
}
