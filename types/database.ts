// ============================================================
// FODAF — Interfaces de TypeScript para la base de datos
// ============================================================

// ---- Enums ----

export type MemberRole = 'admin' | 'member'
export type ContributionStatus = 'pending' | 'approved' | 'rejected'
export type LoanStatus = 'pending' | 'active' | 'paid' | 'defaulted' | 'rejected'
export type PenaltyReason = 'absence' | 'late_arrival' | 'other'
export type PenaltyStatus = 'pending' | 'paid' | 'deducted_from_savings'
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected'
export type InvestmentStatus = 'active' | 'completed'
export type ActivityStatus = 'scheduled' | 'in_progress' | 'finished'

// ---- Tables ----

export interface Profile {
  id: string
  full_name: string
  role: MemberRole
  phone: string | null
  created_at: string
}

export interface Contribution {
  id: string
  profile_id: string
  amount: number
  deposit_date: string
  status: ContributionStatus
  created_at: string
}

export interface Loan {
  id: string
  profile_id: string
  guarantor_id: string | null
  requested_amount: number
  interest_rate: number
  installments: number
  status: LoanStatus
  created_at: string
}

export interface LoanPayment {
  id: string
  loan_id: string
  amount: number
  payment_date: string
  created_at: string
}

export interface Team {
  id: string
  name: string
  term: string
  created_at: string
}

export interface TeamMember {
  team_id: string
  profile_id: string
  role_title: string | null
}

export interface Activity {
  id: string
  team_id: string | null
  name: string
  activity_date: string
  /** Fecha y hora de inicio (timestamptz). Las actividades nuevas la requieren; las creadas antes de la migración pueden tener `null`. */
  start_at: string | null
  status: ActivityStatus
  finished_at: string | null
  created_at: string
}

export interface ActivityExpense {
  id: string
  activity_id: string
  description: string
  amount: number
  created_at: string
}

export interface ActivityProduct {
  id: string
  activity_id: string
  name: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  created_at: string
}

export interface ActivitySale {
  id: string
  activity_id: string
  seller_id: string
  /** Comprador como miembro del fondo (FK a profiles). Mutuamente excluyente con `buyer_name`. */
  buyer_id: string | null
  /** Texto libre para compradores externos (vecinos, invitados). Mutuamente excluyente con `buyer_id`. */
  buyer_name: string | null
  product_id: string
  quantity: number
  /** Calculado por trigger: quantity * selling_price del producto. */
  total_price: number
  created_at: string
}

export interface Meeting {
  id: string
  topic: string
  meeting_date: string
  created_at: string
}

export interface Penalty {
  id: string
  profile_id: string
  meeting_id: string | null
  reason: PenaltyReason
  amount: number
  status: PenaltyStatus
  created_at: string
}

export interface Withdrawal {
  id: string
  profile_id: string
  amount: number
  status: WithdrawalStatus
  created_at: string
}

export interface Investment {
  id: string
  name: string
  invested_amount: number
  annual_interest_rate: number
  start_date: string
  end_date: string
  status: InvestmentStatus
  actual_return: number | null
  created_at: string
}

/**
 * Parámetros configurables del fondo, con histórico por año.
 * Los valores cambian según los estatutos; cada año tiene su
 * propia fila para preservar la integridad de cálculos pasados.
 *
 * Solo contiene los parámetros que el código consume; las reglas
 * de estatutos sin lógica implementada no se parametrizan.
 */
export interface FundSettings {
  year: number

  // Ahorros
  min_savings_minor: number
  min_savings_adult: number

  // Moras y sanciones
  penalty_absence: number
  penalty_late_arrival: number

  // Préstamos
  min_interest_rate: number
  loan_limit_without_guarantor: number
  loan_savings_percentage_cap: number

  // Cierre anual
  year_end_base: number

  created_at: string
  updated_at: string
}

// ---- Database schema map (útil para tipado genérico) ----

export interface Database {
  profiles: Profile
  contributions: Contribution
  loans: Loan
  loan_payments: LoanPayment
  teams: Team
  team_members: TeamMember
  activities: Activity
  activity_expenses: ActivityExpense
  activity_products: ActivityProduct
  activity_sales: ActivitySale
  meetings: Meeting
  penalties: Penalty
  withdrawals: Withdrawal
  investments: Investment
  fund_settings: FundSettings
}
