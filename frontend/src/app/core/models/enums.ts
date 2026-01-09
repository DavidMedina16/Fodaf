// Contribution enums
export enum ContributionType {
  MONTHLY = 'Mensual',
  EXTRAORDINARY = 'Extraordinario',
}

export enum ContributionStatus {
  PAID = 'Pagado',
  PENDING = 'Pendiente',
  OVERDUE = 'Vencido',
}

// Loan enums
export enum LoanStatus {
  PENDING = 'Pendiente',
  APPROVED = 'Aprobado',
  PAID = 'Pagado',
  REJECTED = 'Rechazado',
}

export enum InstallmentStatus {
  PENDING = 'Pendiente',
  PAID = 'Pagado',
  OVERDUE = 'Vencido',
}

// Fine enums
export enum FineStatus {
  PENDING = 'Pendiente',
  PAID = 'Pagada',
}

// Investment enums
export enum InvestmentStatus {
  ACTIVE = 'Activa',
  FINISHED = 'Finalizada',
  RENEWED = 'Renovada',
}

// Event transaction enums
export enum TransactionType {
  INCOME = 'Ingreso',
  EXPENSE = 'Gasto',
}

// Role names (predefined in seeder)
export enum RoleName {
  SUPER_ADMIN = 'Super Admin',
  PRESIDENTE = 'Presidente',
  TESORERIA = 'Tesoreria',
  MIEMBRO = 'Miembro',
}
