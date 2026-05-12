import Link from 'next/link';
import { AlertCircle, Calculator, TrendingUp } from 'lucide-react';
import { prisma } from '../../../lib/prisma';
import { getUser } from '../../../lib/data';
import { estimateTax, compareTaxRegimes } from '../../../lib/taxEstimator';
import Card from '../../../components/ui/Card';

export const revalidate = 60;

export default async function TaxPage() {
  let user = await getUser();
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'Me', email: 'me@lifeos.local' },
      select: { id: true, name: true, email: true, preferences: true }
    });
  }

  const preferences = (user.preferences as any) || {};
  const country = preferences.taxCountry || 'India';
  const preferredRegime = preferences.preferredTaxRegime || 'NEW';

  // Calculate financial year dates (April 1 to March 31)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11, so April is month 3
  
  // If current month is before April (0-2), use previous FY
  let fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
  const fyStart = new Date(fyStartYear, 3, 1); // April 1
  const fyEnd = new Date(fyStartYear + 1, 2, 31); // March 31 next year

  // Fetch all INCOME and EXPENSE transactions for the user in this FY using Prisma
  const incomeTransactions = await prisma.transaction.findMany({
    where: {
      account: { userId: user.id },
      type: 'INCOME',
      date: { gte: fyStart, lte: fyEnd }
    },
    orderBy: { date: 'asc' }
  });

  const expenseTransactions = await prisma.transaction.findMany({
    where: {
      account: { userId: user.id },
      type: 'EXPENSE',
      date: { gte: fyStart, lte: fyEnd }
    },
    orderBy: { date: 'asc' }
  });

  // Calculate totals
  const totalIncome = incomeTransactions.reduce((sum: number, tx: any) => sum + (tx.amount ?? 0), 0);

  // Deductible expense categories
  const deductibleCategories = ['Rent', 'Insurance', 'Tax', 'Donation', 'Medical', 'Education', 'Investment'];
  const totalDeductibleExpenses = expenseTransactions
    .filter((tx: any) => deductibleCategories.includes(tx.category))
    .reduce((sum: number, tx: any) => sum + (tx.amount ?? 0), 0);

  // Calculate taxes for both regimes
  const comparison = compareTaxRegimes(totalIncome, totalDeductibleExpenses, country);
  const selectedRegime = preferredRegime === 'OLD' ? comparison.oldRegime : comparison.newRegime;
  const alternateRegime = preferredRegime === 'OLD' ? comparison.newRegime : comparison.oldRegime;

  const fyLabel = `FY ${fyStart.getFullYear()}-${(fyStart.getFullYear() + 1).toString().slice(2)}`;

  return (
    <section className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-semibold">Tax Estimation</h2>
        <p className="text-sm text-gray-600 dark:text-gray-500">Quick estimate of your tax liability for {fyLabel}</p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">⚠️ This is a rough estimate only.</p>
            <p className="mt-1">Not a substitute for professional tax advice. Consult a CA for accurate tax planning. Rates are approximate for FY 2025-26.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Selected Regime */}
        <Card className="border-2 border-blue-400 dark:border-blue-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
              <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{preferredRegime === 'NEW' ? 'New Regime' : 'Old Regime'} (Selected)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your current preference</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700 p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">Gross Income ({fyLabel})</p>
              <p className="text-2xl font-bold">₹{selectedRegime.grossIncome.toLocaleString()}</p>
            </div>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-700 p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">Taxable Income</p>
              <p className="text-xl font-semibold">₹{selectedRegime.taxableIncome.toLocaleString()}</p>
            </div>

            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 p-3 border border-blue-200 dark:border-blue-700">
              <p className="text-xs text-blue-600 dark:text-blue-400">Total Tax Liability</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">₹{selectedRegime.totalTax.toLocaleString()}</p>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <TrendingUp className="inline h-4 w-4 mr-1" />
                Effective Rate: <span className="font-semibold">{selectedRegime.effectiveRate.toFixed(2)}%</span>
              </p>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Income Tax:</span>
                  <span className="font-semibold">₹{selectedRegime.incomeTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Education Cess (4%):</span>
                  <span className="font-semibold">₹{selectedRegime.educationCess.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Alternate Regime */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-2">
              <Calculator className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{preferredRegime === 'NEW' ? 'Old Regime' : 'New Regime'} (Alternate)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Compare your options</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700 p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">Gross Income ({fyLabel})</p>
              <p className="text-2xl font-bold">₹{alternateRegime.grossIncome.toLocaleString()}</p>
            </div>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-700 p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">Taxable Income</p>
              <p className="text-xl font-semibold">₹{alternateRegime.taxableIncome.toLocaleString()}</p>
            </div>

            {comparison.savings > 0 && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 p-3 border border-emerald-200 dark:border-emerald-700">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Potential Tax Savings</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{comparison.savings.toLocaleString()}</p>
              </div>
            )}

            <div className="rounded-xl bg-gray-50 dark:bg-gray-700 p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Tax Liability</p>
              <p className="text-xl font-semibold">₹{alternateRegime.totalTax.toLocaleString()}</p>
              <p className="mt-1 text-xs text-gray-500">Effective Rate: {alternateRegime.effectiveRate.toFixed(2)}%</p>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Income Tax:</span>
                  <span className="font-semibold">₹{alternateRegime.incomeTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Education Cess (4%):</span>
                  <span className="font-semibold">₹{alternateRegime.educationCess.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Summary */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Tax Year Summary ({fyLabel})</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-emerald-700 dark:text-emerald-300">Total Income</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{totalIncome.toLocaleString()}</p>
            <p className="mt-2 text-xs text-emerald-600">From {incomeTransactions.length} transactions</p>
          </div>
          <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-4 border border-rose-200 dark:border-rose-800">
            <p className="text-xs text-rose-700 dark:text-rose-300">Deductible Expenses</p>
            <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">₹{totalDeductibleExpenses.toLocaleString()}</p>
            <p className="mt-2 text-xs text-rose-600">From {expenseTransactions.filter((tx: any) => deductibleCategories.includes(tx.category)).length} transactions</p>
          </div>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">Deduction Rate</p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalIncome > 0 ? ((totalDeductibleExpenses / totalIncome) * 100).toFixed(1) : 0}%
            </p>
            <p className="mt-2 text-xs text-blue-600">Of gross income</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong>Deductible categories included:</strong> {deductibleCategories.join(', ')}
          </p>
          <p className="text-xs text-gray-500">
            To include more deductions or adjust income, please go to{' '}
            <Link href="/money/transactions" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Transactions
            </Link>
            {' '}and review your expense categories.
          </p>
        </div>
      </Card>

      {/* Settings Link */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-500 mb-3">
          Want to change your tax regime preference or country? Update it in{' '}
          <Link href="/settings" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
            Settings
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
