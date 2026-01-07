import { Component, input, output, forwardRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ]
})
export class SelectComponent implements ControlValueAccessor {
  options = input<SelectOption[]>([]);
  placeholder = input<string>('Seleccionar...');
  disabled = input<boolean>(false);
  hasError = input<boolean>(false);
  initialValue = input<string | number>('', { alias: 'value' });

  selectionChange = output<string | number>();

  value = signal<string | number>('');
  isFocused = signal<boolean>(false);

  constructor() {
    effect(() => {
      const initial = this.initialValue();
      if (initial !== undefined) {
        this.value.set(initial);
      }
    });
  }

  private onChange: (value: string | number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | number): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled by input signal
  }

  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newValue = target.value;
    this.value.set(newValue);
    this.onChange(newValue);
    this.selectionChange.emit(newValue);
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }

  onFocus(): void {
    this.isFocused.set(true);
  }

  get selectClasses(): string {
    return [
      'select',
      this.hasError() ? 'select--error' : '',
      this.isFocused() ? 'select--focused' : '',
      !this.value() ? 'select--placeholder' : '',
    ].filter(Boolean).join(' ');
  }
}
