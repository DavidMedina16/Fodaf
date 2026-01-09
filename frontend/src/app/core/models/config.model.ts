export enum ConfigType {
  NUMBER = 'number',
  PERCENTAGE = 'percentage',
  CURRENCY = 'currency',
  TEXT = 'text',
  DATE = 'date',
}

export enum ConfigCategory {
  GENERAL = 'general',
  PAYMENTS = 'payments',
  LOANS = 'loans',
  FINES = 'fines',
  INVESTMENTS = 'investments',
}

export interface AppConfig {
  id: number;
  key: string;
  value: string;
  description: string;
  type: ConfigType;
  category: ConfigCategory;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  [key: string]: {
    value: string;
    description: string;
    type: ConfigType;
    category: ConfigCategory;
    id: number;
  };
}

export interface SystemConfigByCategory {
  [category: string]: SystemConfig;
}

export interface BulkUpdateConfigRequest {
  configs: { key: string; value: string }[];
}

export interface BulkUpdateConfigResponse {
  updated: number;
  configs: AppConfig[];
}

export const CATEGORY_LABELS: Record<ConfigCategory, string> = {
  [ConfigCategory.GENERAL]: 'General',
  [ConfigCategory.PAYMENTS]: 'Pagos y Aportes',
  [ConfigCategory.LOANS]: 'Préstamos',
  [ConfigCategory.FINES]: 'Multas',
  [ConfigCategory.INVESTMENTS]: 'Inversiones',
};

export const TYPE_LABELS: Record<ConfigType, string> = {
  [ConfigType.NUMBER]: 'Número',
  [ConfigType.PERCENTAGE]: 'Porcentaje',
  [ConfigType.CURRENCY]: 'Moneda',
  [ConfigType.TEXT]: 'Texto',
  [ConfigType.DATE]: 'Fecha',
};
