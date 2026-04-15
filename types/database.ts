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
  costs: number
  net_profits: number
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

// ---- Database schema map (útil para tipado genérico) ----

export interface Database {
  profiles: Profile
  contributions: Contribution
  loans: Loan
  loan_payments: LoanPayment
  teams: Team
  team_members: TeamMember
  activities: Activity
  meetings: Meeting
  penalties: Penalty
  withdrawals: Withdrawal
  investments: Investment
}
