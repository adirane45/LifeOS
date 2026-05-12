import { prisma } from './prisma';
import { convertAmount } from './currency';

/**
 * Calculate net worth for each month over the last 12 months
 * Returns an array of { date: string (YYYY-MM), netWorth: number }
 * 
 * Strategy: 
 * 1. Get all accounts with their current balances
 * 2. Get all transactions for all accounts
 * 3. For each month going back 12 months:
 *    - Calculate what the balance would have been by subtracting
 *      all transactions that occurred AFTER that month
 * 4. Convert all balances to base currency
 */
export async function getNetWorthHistory(userId: number, baseCurrency: string = 'INR') {
  // Get all accounts for this user
  const accounts = await prisma.account.findMany({
    where: { userId },
    include: {
      transactions: {
        orderBy: { date: 'asc' }
      }
    }
  });

  if (accounts.length === 0) {
    return [];
  }

  // Generate array of months going back 12 months
  const now = new Date();
  const months: { date: Date; label: string }[] = [];
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }).split('/').reverse().join('-');
    months.push({ date: monthDate, label: monthLabel });
  }

  // For each month, calculate the net worth
  const historyData: { date: string; netWorth: number }[] = [];

  for (const month of months) {
    let monthNetWorth = 0;

    // For each account, calculate its balance at the end of that month
    for (const account of accounts) {
      // Start with current balance
      let monthBalance = account.balance;

      // Subtract all transactions that occurred AFTER this month
      const nextMonthStart = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 1);
      for (const tx of account.transactions) {
        if (tx.date >= nextMonthStart) {
          // This transaction is after the month, so subtract it
          // If it's EXPENSE, it was subtracted from balance, so add it back
          // If it's INCOME, it was added to balance, so subtract it
          monthBalance -= (tx.type === 'EXPENSE' ? -tx.amount : tx.amount);
        }
      }

      // Convert to base currency if needed
      try {
        if (account.currency !== baseCurrency) {
          const convertedBalance = await convertAmount(monthBalance, account.currency, baseCurrency);
          monthNetWorth += convertedBalance;
        } else {
          monthNetWorth += monthBalance;
        }
      } catch (error) {
        // Fallback to original currency if conversion fails
        monthNetWorth += monthBalance;
      }
    }

    historyData.push({
      date: month.label,
      netWorth: Math.round(monthNetWorth * 100) / 100 // Round to 2 decimals
    });
  }

  return historyData;
}
