import { EMICalculationResult } from '../types.ts';

export const REGULATORY_MAX_APR = 24.0; // 24% APR regulatory cap for micro-lending
export const DEFAULT_ANNUAL_RATE = 18.0; // 18% p.a. standard Kirana prime rate
export const PROCESSING_FEE_RATE = 0.02; // 2% processing fee
export const GST_RATE_ON_FEE = 0.18; // 18% GST on processing fee
export const OPERATING_DAYS_PER_MONTH = 26; // Kirana standard 26 trade days

/**
 * Deterministic Zero-Hallucination Financial Underwriting Engine
 * Compliant with Reserve Bank of India (RBI) Digital Lending Master Directions
 */
export function calculateDeterministicLoan(
  principal: number,
  annualRate: number = DEFAULT_ANNUAL_RATE,
  tenureMonths: number = 3
): EMICalculationResult {
  // Enforce regulatory APR ceiling
  const sanitizedRate = Math.min(Math.max(annualRate, 8.0), REGULATORY_MAX_APR);
  const sanitizedMonths = Math.max(1, Math.min(tenureMonths, 12));
  const sanitizedPrincipal = Math.max(1000, Math.round(principal));

  // Monthly reducing balance interest rate
  const r = sanitizedRate / 12 / 100;
  
  // EMI = [P * r * (1+r)^n] / [(1+r)^n - 1]
  const factor = Math.pow(1 + r, sanitizedMonths);
  const monthlyEMI = Math.round((sanitizedPrincipal * r * factor) / (factor - 1));
  
  const totalRepayment = monthlyEMI * sanitizedMonths;
  const totalInterest = Math.max(0, totalRepayment - sanitizedPrincipal);

  // Soundbox daily sweep: micro-deductions directly from daily QR settlement balance
  const dailySweepAmount = Math.ceil(monthlyEMI / OPERATING_DAYS_PER_MONTH);

  // Fees & Net Disbursal
  const processingFee = Math.round(sanitizedPrincipal * PROCESSING_FEE_RATE);
  const gstOnFee = Math.round(processingFee * GST_RATE_ON_FEE);
  const totalDeductions = processingFee + gstOnFee;
  const netDisbursement = sanitizedPrincipal - totalDeductions;

  // Month-by-month Amortization Schedule
  let currentBalance = sanitizedPrincipal;
  const amortization = [];

  for (let m = 1; m <= sanitizedMonths; m++) {
    const interestForMonth = Math.round(currentBalance * r);
    // On the final month, reconcile any rounding cents
    const principalForMonth = m === sanitizedMonths ? currentBalance : (monthlyEMI - interestForMonth);
    const closingBalance = Math.max(0, currentBalance - principalForMonth);

    amortization.push({
      month: m,
      openingBalance: currentBalance,
      emi: principalForMonth + interestForMonth,
      principalPaid: principalForMonth,
      interestPaid: interestForMonth,
      closingBalance
    });

    currentBalance = closingBalance;
  }

  return {
    principal: sanitizedPrincipal,
    annualRate: sanitizedRate,
    tenureMonths: sanitizedMonths,
    monthlyEMI,
    dailySweepAmount,
    totalInterest,
    totalRepayment,
    processingFee,
    gstOnFee,
    netDisbursement,
    apr: sanitizedRate,
    amortization
  };
}

/**
 * Format Indian Rupee currency format (e.g. ₹1,50,000)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
