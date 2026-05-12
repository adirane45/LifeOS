/**
 * Tax Estimator Utility
 * Provides rough tax liability estimates for Indian income tax
 * NEW REGIME (FY 2025-26) and OLD REGIME calculations
 */

export interface TaxEstimateResult {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  incomeTax: number;
  educationCess: number;
  totalTax: number;
  effectiveRate: number;
  breakdown: string;
  error?: string;
}

/**
 * Indian income tax slab calculator for NEW REGIME (FY 2025-26)
 * Includes standard deduction of ₹75,000 automatically
 */
function calculateNewRegimeTax(grossIncome: number): { tax: number; breakdown: string } {
  const STANDARD_DEDUCTION = 75000;
  const taxableIncome = Math.max(0, grossIncome - STANDARD_DEDUCTION);

  let tax = 0;
  let breakdown = '';

  // Tax slabs for New Regime FY 2025-26
  if (taxableIncome <= 400000) {
    tax = 0;
    breakdown = `Taxable income ₹${taxableIncome.toLocaleString()} is below ₹4,00,000 slab → No tax`;
  } else if (taxableIncome <= 800000) {
    tax = (taxableIncome - 400000) * 0.05;
    breakdown = `(₹${(taxableIncome - 400000).toLocaleString()} × 5%) = ₹${tax.toLocaleString()}`;
  } else if (taxableIncome <= 1200000) {
    tax = 20000 + (taxableIncome - 800000) * 0.10;
    breakdown = `₹20,000 + (₹${(taxableIncome - 800000).toLocaleString()} × 10%) = ₹${tax.toLocaleString()}`;
  } else if (taxableIncome <= 1600000) {
    tax = 20000 + 40000 + (taxableIncome - 1200000) * 0.15;
    breakdown = `₹60,000 + (₹${(taxableIncome - 1200000).toLocaleString()} × 15%) = ₹${tax.toLocaleString()}`;
  } else if (taxableIncome <= 2000000) {
    tax = 20000 + 40000 + 60000 + (taxableIncome - 1600000) * 0.20;
    breakdown = `₹1,20,000 + (₹${(taxableIncome - 1600000).toLocaleString()} × 20%) = ₹${tax.toLocaleString()}`;
  } else if (taxableIncome <= 2400000) {
    tax = 20000 + 40000 + 60000 + 80000 + (taxableIncome - 2000000) * 0.25;
    breakdown = `₹2,00,000 + (₹${(taxableIncome - 2000000).toLocaleString()} × 25%) = ₹${tax.toLocaleString()}`;
  } else {
    tax = 20000 + 40000 + 60000 + 80000 + 100000 + (taxableIncome - 2400000) * 0.30;
    breakdown = `₹3,00,000 + (₹${(taxableIncome - 2400000).toLocaleString()} × 30%) = ₹${tax.toLocaleString()}`;
  }

  return { tax, breakdown };
}

/**
 * Indian income tax slab calculator for OLD REGIME (FY 2025-26)
 * Simplified - includes standard deduction but not all 80C benefits
 */
function calculateOldRegimeTax(grossIncome: number, deductibleExpenses: number): { tax: number; breakdown: string } {
  // Old regime deductions (simplified)
  const STANDARD_DEDUCTION_OLD = 50000; // Standard deduction for salaried
  const section80C = Math.min(150000, deductibleExpenses); // Up to ₹1.5L under 80C
  const totalDeductions = STANDARD_DEDUCTION_OLD + section80C;
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  let tax = 0;
  let breakdown = '';

  // Tax slabs for Old Regime (approximate for FY 2025-26)
  if (taxableIncome <= 300000) {
    tax = 0;
    breakdown = `Taxable income ₹${taxableIncome.toLocaleString()} is below ₹3,00,000 slab → No tax`;
  } else if (taxableIncome <= 700000) {
    tax = (taxableIncome - 300000) * 0.05;
    breakdown = `(₹${(taxableIncome - 300000).toLocaleString()} × 5%) = ₹${tax.toLocaleString()}`;
  } else if (taxableIncome <= 1000000) {
    tax = 20000 + (taxableIncome - 700000) * 0.20;
    breakdown = `₹20,000 + (₹${(taxableIncome - 700000).toLocaleString()} × 20%) = ₹${tax.toLocaleString()}`;
  } else if (taxableIncome <= 1200000) {
    tax = 20000 + 60000 + (taxableIncome - 1000000) * 0.30;
    breakdown = `₹80,000 + (₹${(taxableIncome - 1000000).toLocaleString()} × 30%) = ₹${tax.toLocaleString()}`;
  } else if (taxableIncome <= 1500000) {
    tax = 20000 + 60000 + 60000 + (taxableIncome - 1200000) * 0.30;
    breakdown = `₹1,40,000 + (₹${(taxableIncome - 1200000).toLocaleString()} × 30%) = ₹${tax.toLocaleString()}`;
  } else {
    tax = 20000 + 60000 + 60000 + 90000 + (taxableIncome - 1500000) * 0.30;
    breakdown = `₹2,30,000 + (₹${(taxableIncome - 1500000).toLocaleString()} × 30%) = ₹${tax.toLocaleString()}`;
  }

  return { tax, breakdown };
}

/**
 * Main function to estimate tax liability
 * @param totalIncome Total gross income
 * @param totalDeductibleExpenses Total deductible expenses (for old regime)
 * @param regime Tax regime: 'NEW' or 'OLD'
 * @param country Country code (only 'India' supported)
 * @returns Tax estimate with breakdown
 */
export function estimateTax(
  totalIncome: number,
  totalDeductibleExpenses: number = 0,
  regime: 'OLD' | 'NEW' = 'NEW',
  country: string = 'India'
): TaxEstimateResult {
  // Validate country
  if (country.toLowerCase() !== 'india') {
    return {
      grossIncome: totalIncome,
      totalDeductions: totalDeductibleExpenses,
      taxableIncome: 0,
      incomeTax: 0,
      educationCess: 0,
      totalTax: 0,
      effectiveRate: 0,
      breakdown: '',
      error: 'Tax estimation is currently only available for India'
    };
  }

  let incomeTax = 0;
  let taxBreakdown = '';
  let taxableIncome = 0;

  if (regime === 'NEW') {
    const result = calculateNewRegimeTax(totalIncome);
    incomeTax = result.tax;
    taxBreakdown = result.breakdown;
    taxableIncome = Math.max(0, totalIncome - 75000);
  } else {
    const result = calculateOldRegimeTax(totalIncome, totalDeductibleExpenses);
    incomeTax = result.tax;
    taxBreakdown = result.breakdown;
    const STANDARD_DEDUCTION_OLD = 50000;
    const section80C = Math.min(150000, totalDeductibleExpenses);
    taxableIncome = Math.max(0, totalIncome - STANDARD_DEDUCTION_OLD - section80C);
  }

  // Education Cess: 4% on income tax (applicable above ₹0)
  const educationCess = incomeTax > 0 ? incomeTax * 0.04 : 0;
  const totalTax = incomeTax + educationCess;
  const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;

  const breakdown = `
Gross Income: ₹${totalIncome.toLocaleString()}
Regime: ${regime === 'NEW' ? 'New Regime' : 'Old Regime'}

Deductions:
${regime === 'NEW' ? `- Standard Deduction: ₹75,000` : `- Standard Deduction: ₹50,000\n- Section 80C & Other: ₹${Math.min(150000, totalDeductibleExpenses).toLocaleString()}`}

Taxable Income: ₹${taxableIncome.toLocaleString()}

Tax Calculation:
${taxBreakdown}

Education Cess (4%): ₹${educationCess.toFixed(0)}
Total Tax Liability: ₹${totalTax.toFixed(0)}
Effective Tax Rate: ${effectiveRate.toFixed(2)}%

⚠️ This is a rough estimate, not professional tax advice.
  `;

  return {
    grossIncome: totalIncome,
    totalDeductions: regime === 'NEW' ? 75000 : 50000 + Math.min(150000, totalDeductibleExpenses),
    taxableIncome,
    incomeTax: Math.round(incomeTax),
    educationCess: Math.round(educationCess),
    totalTax: Math.round(totalTax),
    effectiveRate: Number(effectiveRate.toFixed(2)),
    breakdown
  };
}

/**
 * Calculate tax for both regimes and return comparison
 */
export function compareTaxRegimes(
  totalIncome: number,
  totalDeductibleExpenses: number = 0,
  country: string = 'India'
) {
  const newRegime = estimateTax(totalIncome, totalDeductibleExpenses, 'NEW', country);
  const oldRegime = estimateTax(totalIncome, totalDeductibleExpenses, 'OLD', country);

  return {
    newRegime,
    oldRegime,
    savings: Math.max(0, oldRegime.totalTax - newRegime.totalTax),
    betterRegime: oldRegime.totalTax > newRegime.totalTax ? 'NEW' : 'OLD'
  };
}
