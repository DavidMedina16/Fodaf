import { Injectable } from '@nestjs/common';

export interface AmortizationRow {
  installmentNumber: number;
  dueDate: Date;
  amountCapital: number;
  amountInterest: number;
  totalAmount: number;
  remainingBalance: number;
}

export interface LoanCalculation {
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  amortizationSchedule: AmortizationRow[];
}

@Injectable()
export class LoanCalculationService {
  /**
   * Calcula la cuota mensual usando el sistema francés (cuota fija)
   * Fórmula: Cuota = P * [r * (1 + r)^n] / [(1 + r)^n - 1]
   * @param principal Monto del préstamo
   * @param annualInterestRate Tasa de interés anual (ej: 2.0 para 2%)
   * @param termMonths Plazo en meses
   */
  calculateMonthlyPayment(
    principal: number,
    annualInterestRate: number,
    termMonths: number,
  ): number {
    // Si la tasa es 0, es una división simple
    if (annualInterestRate === 0) {
      return principal / termMonths;
    }

    // Convertir tasa anual a mensual
    const monthlyRate = annualInterestRate / 100 / 12;

    // Fórmula del sistema francés
    const factor = Math.pow(1 + monthlyRate, termMonths);
    const monthlyPayment = (principal * (monthlyRate * factor)) / (factor - 1);

    return this.round(monthlyPayment);
  }

  /**
   * Genera la tabla de amortización completa
   */
  generateAmortizationSchedule(
    principal: number,
    annualInterestRate: number,
    termMonths: number,
    startDate: Date = new Date(),
  ): LoanCalculation {
    const monthlyPayment = this.calculateMonthlyPayment(
      principal,
      annualInterestRate,
      termMonths,
    );
    const monthlyRate = annualInterestRate / 100 / 12;

    let remainingBalance = principal;
    const schedule: AmortizationRow[] = [];
    let totalInterest = 0;

    for (let i = 1; i <= termMonths; i++) {
      // Calcular interés del periodo
      const interestPayment = this.round(remainingBalance * monthlyRate);

      // Calcular abono a capital
      let capitalPayment = this.round(monthlyPayment - interestPayment);

      // En la última cuota, ajustar el capital para que el saldo sea exactamente 0
      if (i === termMonths) {
        capitalPayment = this.round(remainingBalance);
      }

      // Nuevo saldo
      remainingBalance = this.round(remainingBalance - capitalPayment);

      // Asegurar que no quede negativo por errores de redondeo
      if (remainingBalance < 0) {
        remainingBalance = 0;
      }

      // Calcular fecha de vencimiento
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      totalInterest += interestPayment;

      schedule.push({
        installmentNumber: i,
        dueDate,
        amountCapital: capitalPayment,
        amountInterest: interestPayment,
        totalAmount: this.round(capitalPayment + interestPayment),
        remainingBalance,
      });
    }

    return {
      monthlyPayment,
      totalAmount: this.round(principal + totalInterest),
      totalInterest: this.round(totalInterest),
      amortizationSchedule: schedule,
    };
  }

  /**
   * Simula el cálculo sin generar la tabla completa (para calculadora rápida)
   */
  simulate(
    principal: number,
    annualInterestRate: number,
    termMonths: number,
  ): Omit<LoanCalculation, 'amortizationSchedule'> {
    const monthlyPayment = this.calculateMonthlyPayment(
      principal,
      annualInterestRate,
      termMonths,
    );

    const totalAmount = this.round(monthlyPayment * termMonths);
    const totalInterest = this.round(totalAmount - principal);

    return {
      monthlyPayment,
      totalAmount,
      totalInterest,
    };
  }

  /**
   * Redondea a 2 decimales
   */
  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
