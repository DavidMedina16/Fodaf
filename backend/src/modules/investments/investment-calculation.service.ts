import { Injectable } from '@nestjs/common';

export interface InvestmentCalculation {
  amountInvested: number;
  interestRate: number;
  termDays: number;
  expectedReturn: number;
  totalAtMaturity: number;
  dailyRate: number;
  effectiveAnnualRate: number;
  startDate: Date;
  endDate: Date;
}

export interface InvestmentSimulation {
  amountInvested: number;
  interestRate: number;
  termDays: number;
  expectedReturn: number;
  totalAtMaturity: number;
  monthlyEquivalent: number;
}

@Injectable()
export class InvestmentCalculationService {
  /**
   * Calcula el rendimiento de un CDT usando interés simple
   * Fórmula: Interés = Capital × Tasa × (Días / 365)
   */
  calculateReturn(
    amountInvested: number,
    interestRate: number,
    termDays: number,
  ): { expectedReturn: number; totalAtMaturity: number } {
    // Convertir tasa anual a decimal
    const annualRate = interestRate / 100;

    // Cálculo de interés simple para CDT
    // I = P × r × (t/365)
    const expectedReturn = amountInvested * annualRate * (termDays / 365);

    // Total al vencimiento
    const totalAtMaturity = amountInvested + expectedReturn;

    return {
      expectedReturn: Math.round(expectedReturn * 100) / 100,
      totalAtMaturity: Math.round(totalAtMaturity * 100) / 100,
    };
  }

  /**
   * Calcula la fecha de vencimiento basada en la fecha de inicio y el plazo
   */
  calculateEndDate(startDate: Date, termDays: number): Date {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + termDays);
    return endDate;
  }

  /**
   * Genera un cálculo completo de inversión
   */
  generateCalculation(
    amountInvested: number,
    interestRate: number,
    termDays: number,
    startDate?: Date,
  ): InvestmentCalculation {
    const start = startDate || new Date();
    const endDate = this.calculateEndDate(start, termDays);
    const { expectedReturn, totalAtMaturity } = this.calculateReturn(
      amountInvested,
      interestRate,
      termDays,
    );

    // Tasa diaria
    const dailyRate = interestRate / 365;

    // Tasa efectiva anual (TEA) para referencia
    // TEA = (1 + r/365)^365 - 1
    const effectiveAnnualRate =
      (Math.pow(1 + interestRate / 100 / 365, 365) - 1) * 100;

    return {
      amountInvested,
      interestRate,
      termDays,
      expectedReturn,
      totalAtMaturity,
      dailyRate: Math.round(dailyRate * 10000) / 10000,
      effectiveAnnualRate: Math.round(effectiveAnnualRate * 100) / 100,
      startDate: start,
      endDate,
    };
  }

  /**
   * Simula una inversión sin guardar (para calculadora)
   */
  simulate(
    amountInvested: number,
    interestRate: number,
    termDays: number,
  ): InvestmentSimulation {
    const { expectedReturn, totalAtMaturity } = this.calculateReturn(
      amountInvested,
      interestRate,
      termDays,
    );

    // Rendimiento mensual equivalente
    const monthlyEquivalent = (expectedReturn / termDays) * 30;

    return {
      amountInvested,
      interestRate,
      termDays,
      expectedReturn,
      totalAtMaturity,
      monthlyEquivalent: Math.round(monthlyEquivalent * 100) / 100,
    };
  }

  /**
   * Calcula los días restantes hasta el vencimiento
   */
  getDaysRemaining(endDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Calcula el rendimiento acumulado hasta la fecha actual
   */
  getAccruedReturn(
    amountInvested: number,
    interestRate: number,
    startDate: Date,
  ): number {
    const today = new Date();
    const start = new Date(startDate);

    const daysElapsed = Math.max(
      0,
      Math.ceil(
        (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    const { expectedReturn } = this.calculateReturn(
      amountInvested,
      interestRate,
      daysElapsed,
    );

    return expectedReturn;
  }
}
