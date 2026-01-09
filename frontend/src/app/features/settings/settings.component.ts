import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '@shared/components/card/card.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '@shared/services/toast.service';
import { ConfigService } from './services/config.service';
import {
  AppConfig,
  ConfigCategory,
  ConfigType,
  CATEGORY_LABELS,
} from '@core/models/config.model';

interface ConfigGroup {
  category: ConfigCategory;
  label: string;
  configs: AppConfig[];
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="settings-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Configuraci&oacute;n del Sistema</h1>
          <p class="subtitle">
            Administra los par&aacute;metros generales del fondo de ahorro
          </p>
        </div>
        <div class="header-actions">
          @if (hasChanges()) {
            <app-button variant="secondary" (click)="cancelChanges()">
              Cancelar
            </app-button>
            <app-button
              variant="primary"
              [loading]="saving()"
              (click)="saveChanges()"
            >
              Guardar Cambios
            </app-button>
          }
        </div>
      </header>

      @if (loading()) {
        <div class="loading-container">
          <app-loading-spinner />
        </div>
      } @else {
        <div class="settings-grid">
          @for (group of configGroups(); track group.category) {
            <app-card>
              <div class="config-group">
                <h2 class="group-title">
                  <span class="icon">{{ getCategoryIcon(group.category) }}</span>
                  {{ group.label }}
                </h2>
                <div class="config-list">
                  @for (config of group.configs; track config.key) {
                    <div class="config-item">
                      <div class="config-info">
                        <label [for]="config.key" class="config-label">
                          {{ config.description || config.key }}
                        </label>
                        <span class="config-key">{{ config.key }}</span>
                      </div>
                      <div class="config-input">
                        @switch (config.type) {
                          @case ('currency') {
                            <div class="input-with-prefix">
                              <span class="prefix">$</span>
                              <input
                                type="number"
                                [id]="config.key"
                                [(ngModel)]="editedValues()[config.key]"
                                (ngModelChange)="onValueChange(config.key, $event)"
                                class="config-field"
                                min="0"
                              />
                            </div>
                          }
                          @case ('percentage') {
                            <div class="input-with-suffix">
                              <input
                                type="number"
                                [id]="config.key"
                                [(ngModel)]="editedValues()[config.key]"
                                (ngModelChange)="onValueChange(config.key, $event)"
                                class="config-field"
                                min="0"
                                max="100"
                                step="0.1"
                              />
                              <span class="suffix">%</span>
                            </div>
                          }
                          @case ('number') {
                            <input
                              type="number"
                              [id]="config.key"
                              [(ngModel)]="editedValues()[config.key]"
                              (ngModelChange)="onValueChange(config.key, $event)"
                              class="config-field"
                              min="0"
                            />
                          }
                          @default {
                            <input
                              type="text"
                              [id]="config.key"
                              [(ngModel)]="editedValues()[config.key]"
                              (ngModelChange)="onValueChange(config.key, $event)"
                              class="config-field"
                            />
                          }
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </app-card>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .settings-container {
        padding: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .header-content h1 {
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 0.5rem;
      }

      .subtitle {
        color: var(--text-secondary);
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 0.75rem;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 4rem;
      }

      .settings-grid {
        display: grid;
        gap: 1.5rem;
      }

      .config-group {
        padding: 0.5rem;
      }

      .group-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 1.5rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--border-color);
      }

      .group-title .icon {
        font-size: 1.25rem;
      }

      .config-list {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .config-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border-radius: 8px;
      }

      .config-info {
        flex: 1;
        min-width: 0;
      }

      .config-label {
        display: block;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
      }

      .config-key {
        display: block;
        font-size: 0.75rem;
        color: var(--text-muted);
        font-family: monospace;
      }

      .config-input {
        flex: 0 0 200px;
      }

      .config-field {
        width: 100%;
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-size: 0.875rem;
        background: var(--bg-primary);
        color: var(--text-primary);
        transition: border-color 0.2s;
      }

      .config-field:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      .input-with-prefix,
      .input-with-suffix {
        display: flex;
        align-items: center;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        overflow: hidden;
      }

      .input-with-prefix:focus-within,
      .input-with-suffix:focus-within {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      .input-with-prefix .config-field,
      .input-with-suffix .config-field {
        border: none;
        box-shadow: none;
      }

      .prefix,
      .suffix {
        padding: 0.625rem 0.75rem;
        background: var(--bg-secondary);
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-weight: 500;
      }

      @media (max-width: 768px) {
        .settings-container {
          padding: 1rem;
        }

        .page-header {
          flex-direction: column;
        }

        .header-actions {
          width: 100%;
          justify-content: flex-end;
        }

        .config-item {
          flex-direction: column;
          align-items: flex-start;
        }

        .config-input {
          flex: none;
          width: 100%;
        }
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);
  configs = signal<AppConfig[]>([]);
  configGroups = signal<ConfigGroup[]>([]);
  originalValues = signal<Record<string, string>>({});
  editedValues = signal<Record<string, string>>({});
  hasChanges = signal(false);

  ngOnInit(): void {
    this.loadConfigs();
  }

  loadConfigs(): void {
    this.loading.set(true);
    this.configService.getAll().subscribe({
      next: (configs) => {
        this.configs.set(configs);
        this.groupConfigsByCategory(configs);

        const values: Record<string, string> = {};
        configs.forEach((c) => (values[c.key] = c.value));
        this.originalValues.set({ ...values });
        this.editedValues.set({ ...values });
        this.hasChanges.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar la configuraci\u00f3n');
        this.loading.set(false);
      },
    });
  }

  groupConfigsByCategory(configs: AppConfig[]): void {
    const groups: Record<ConfigCategory, AppConfig[]> = {
      [ConfigCategory.GENERAL]: [],
      [ConfigCategory.PAYMENTS]: [],
      [ConfigCategory.LOANS]: [],
      [ConfigCategory.FINES]: [],
      [ConfigCategory.INVESTMENTS]: [],
    };

    configs.forEach((config) => {
      const category = config.category || ConfigCategory.GENERAL;
      if (groups[category]) {
        groups[category].push(config);
      }
    });

    const result: ConfigGroup[] = Object.entries(groups)
      .filter(([, items]) => items.length > 0)
      .map(([category, items]) => ({
        category: category as ConfigCategory,
        label: CATEGORY_LABELS[category as ConfigCategory] || category,
        configs: items,
      }));

    this.configGroups.set(result);
  }

  getCategoryIcon(category: ConfigCategory): string {
    const icons: Record<ConfigCategory, string> = {
      [ConfigCategory.GENERAL]: '\u2699\ufe0f',
      [ConfigCategory.PAYMENTS]: '\ud83d\udcb0',
      [ConfigCategory.LOANS]: '\ud83c\udfe6',
      [ConfigCategory.FINES]: '\u26a0\ufe0f',
      [ConfigCategory.INVESTMENTS]: '\ud83d\udcc8',
    };
    return icons[category] || '\u2699\ufe0f';
  }

  onValueChange(key: string, value: string): void {
    const edited = { ...this.editedValues() };
    edited[key] = value;
    this.editedValues.set(edited);
    this.checkForChanges();
  }

  checkForChanges(): void {
    const original = this.originalValues();
    const edited = this.editedValues();
    const changed = Object.keys(original).some(
      (key) => original[key] !== edited[key]?.toString()
    );
    this.hasChanges.set(changed);
  }

  cancelChanges(): void {
    this.editedValues.set({ ...this.originalValues() });
    this.hasChanges.set(false);
    this.toast.info('Cambios cancelados');
  }

  saveChanges(): void {
    const original = this.originalValues();
    const edited = this.editedValues();
    const changedConfigs = Object.keys(original)
      .filter((key) => original[key] !== edited[key]?.toString())
      .map((key) => ({ key, value: edited[key]?.toString() || '' }));

    if (changedConfigs.length === 0) {
      return;
    }

    this.saving.set(true);
    this.configService.bulkUpdate({ configs: changedConfigs }).subscribe({
      next: (response) => {
        this.originalValues.set({ ...edited });
        this.hasChanges.set(false);
        this.saving.set(false);
        this.toast.success(
          `${response.updated} configuraci\u00f3n(es) actualizada(s)`
        );
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Error al guardar la configuraci\u00f3n');
      },
    });
  }
}
