import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss'
})
export class LoadingSpinnerComponent {
  size = input<SpinnerSize>('md');
  color = input<'primary' | 'white' | 'gray'>('primary');
  fullPage = input<boolean>(false);
  text = input<string>('');
}
