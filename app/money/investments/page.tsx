import Link from 'next/link';
import { ArrowLeft, Plus, RefreshCw, TrendingUp } from 'lucide-react';
import { prisma } from '../../../lib/prisma';
import { getInvestments, getUser } from '../../../lib/data';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { getLivePrice, calculatePerformance } from '../../../lib/investmentApi';
import InvestmentsClient from '../../../components/InvestmentsClient';

export const dynamic = 'force-dynamic';

export default async function InvestmentsPage() {
  let user = await getUser();
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'Me', email: 'me@lifeos.local' },
      select: { id: true, name: true, email: true }
    });
  }

  const investments = await getInvestments(user.id);

  // Fetch live prices for all investments
  const investmentsWithPrices = await Promise.all(
    investments.map(async (inv: any) => {
      const priceData = await getLivePrice(inv.symbol);
      const performance = priceData
        ? calculatePerformance(inv.quantity, inv.buyPrice, priceData.price)
        : {
            totalInvested: inv.quantity * inv.buyPrice,
            currentValue: 0,
            profitLoss: 0,
            profitLossPercent: 0
          };

      // Calculate dividends
      const dividends = inv.transactions
        .filter((t: any) => t.type === 'DIVIDEND')
        .reduce((sum: number, t: any) => sum + t.quantity * t.price, 0);

      return {
        ...inv,
        currentPrice: priceData?.price || null,
        changePercent: priceData?.changePercent || null,
        performance,
        dividends
      };
    })
  );

  // Calculate portfolio summary
  const portfolioSummary = investmentsWithPrices.reduce(
    (acc: any, inv: any) => {
      return {
        totalInvested: acc.totalInvested + inv.performance.totalInvested,
        currentValue: acc.currentValue + inv.performance.currentValue,
        totalDividends: acc.totalDividends + inv.dividends,
        byType: {
          ...acc.byType,
          [inv.type]: (acc.byType[inv.type] || 0) + inv.performance.currentValue
        }
      };
    },
    { totalInvested: 0, currentValue: 0, totalDividends: 0, byType: {} as Record<string, number> }
  );

  const totalProfitLoss = portfolioSummary.currentValue - portfolioSummary.totalInvested;
  const totalProfitLossPercent =
    portfolioSummary.totalInvested > 0
      ? (totalProfitLoss / portfolioSummary.totalInvested) * 100
      : 0;

  return (
    <section className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/money" className="flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Investment Portfolio</h2>
            <p className="text-sm text-gray-600 dark:text-gray-500">Track stocks, crypto, and other assets</p>
          </div>
        </div>
      </div>

      {/* Portfolio Summary */}
      <Card className="p-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Portfolio Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Invested</p>
              <p className="text-xl font-bold">₹{portfolioSummary.totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Value</p>
              <p className="text-xl font-bold">₹{portfolioSummary.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Profit/Loss</p>
              <p className={`text-xl font-bold ${totalProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                ₹{totalProfitLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Return %</p>
              <p className={`text-xl font-bold ${totalProfitLossPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {totalProfitLossPercent.toFixed(2)}%
              </p>
            </div>
          </div>
          {portfolioSummary.totalDividends > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Dividends Received</p>
              <p className="text-lg font-semibold">₹{portfolioSummary.totalDividends.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Client Component for Add Form and Refresh */}
      <InvestmentsClient initialInvestments={investmentsWithPrices} />

      {/* Investments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Investments</h3>
        </div>

        {investmentsWithPrices.length === 0 ? (
          <Card className="p-8 text-center">
            <TrendingUp className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No investments yet. Add your first investment to get started!</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {investmentsWithPrices.map((inv) => (
              <Card key={inv.id} className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{inv.name}</h4>
                      <p className="text-xs text-gray-500">{inv.symbol}</p>
                    </div>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                      {inv.type}
                    </span>
                  </div>

                  {/* Price Info */}
                  <div className="space-y-1">
                    {inv.currentPrice ? (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Current Price</span>
                          <span className="font-semibold">₹{inv.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        {inv.changePercent !== null && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">24h Change</span>
                            <span className={inv.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {inv.changePercent >= 0 ? '+' : ''}{inv.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">Price unavailable</p>
                    )}
                  </div>

                  {/* Quantity & Values */}
                  <div className="space-y-1 border-t pt-2 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Quantity</span>
                      <span className="font-semibold">{inv.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Invested</span>
                      <span className="font-semibold">₹{inv.performance.totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Current Value</span>
                      <span className="font-semibold">₹{inv.performance.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  {/* P&L */}
                  <div
                    className={`p-2 rounded text-sm font-semibold text-center ${
                      inv.performance.profitLoss >= 0
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {inv.performance.profitLoss >= 0 ? '+' : ''}₹{inv.performance.profitLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (
                    {inv.performance.profitLossPercent.toFixed(2)}%)
                  </div>

                  {/* Dividends */}
                  {inv.dividends > 0 && (
                    <div className="text-xs bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-blue-800 dark:text-blue-300">
                      Dividends: ₹{inv.dividends.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
