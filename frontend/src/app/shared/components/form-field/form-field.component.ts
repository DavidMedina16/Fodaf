import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss'
})
export class FormFieldComponent {
  label = input<string>('');
  required = input<boolean>(false);
  error = input<string>('');
  hint = input<string>('');
  fieldId = input<string>('');
}
