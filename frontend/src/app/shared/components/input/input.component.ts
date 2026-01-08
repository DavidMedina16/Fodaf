import { Component, input, output, forwardRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'search' | 'date' | 'month';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  type = input<InputType>('text');
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  hasError = input<boolean>(false);
  autocomplete = input<string>('off');
  maxlength = input<number | null>(null);
  min = input<number | null>(null);
  max = input<number | null>(null);
  step = input<number | null>(null);
  initialValue = input<string>('', { alias: 'value' });

  inputChange = output<string>();
  inputBlur = output<void>();
  inputFocus = output<void>();

  value = signal<string>('');
  showPassword = signal<boolean>(false);
  isFocused = signal<boolean>(false);

  constructor() {
    effect(() => {
      const initial = this.initialValue();
      if (initial !== undefined) {
        this.value.set(initial);
      }
    });
  }

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled by input signal
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
    this.inputChange.emit(target.value);
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
    this.inputBlur.emit();
  }

  onFocus(): void {
    this.isFocused.set(true);
    this.inputFocus.emit();
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  get inputType(): string {
    if (this.type() === 'password' && this.showPassword()) {
      return 'text';
    }
    return this.type();
  }

  get inputClasses(): string {
    return [
      'input',
      this.hasError() ? 'input--error' : '',
      this.isFocused() ? 'input--focused' : '',
      this.type() === 'password' ? 'input--has-suffix' : '',
    ].filter(Boolean).join(' ');
  }
}
