'use client';

import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import { createInvestment, deleteInvestment } from '../app/money/investments/actions';

const INVESTMENT_TYPES = [
  'STOCK',
  'MUTUAL_FUND',
  'CRYPTO',
  'ETF',
  'BOND',
  'REAL_ESTATE',
  'OTHER'
];

export default function InvestmentsClient({ initialInvestments }: { initialInvestments: any[] }) {
  const [investments, setInvestments] = useState(initialInvestments);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'STOCK',
    quantity: '',
    buyPrice: '',
    currency: 'USD',
    notes: ''
  });

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createInvestment({
        name: formData.name,
        symbol: formData.symbol,
        type: formData.type,
        quantity: parseFloat(formData.quantity),
        buyPrice: parseFloat(formData.buyPrice),
        currency: formData.currency,
        notes: formData.notes || undefined
      });

      // Reset form
      setFormData({
        name: '',
        symbol: '',
        type: 'STOCK',
        quantity: '',
        buyPrice: '',
        currency: 'USD',
        notes: ''
      });
      setShowForm(false);

      // Refresh page to get updated data with live prices
      window.location.reload();
    } catch (error) {
      console.error('Error creating investment:', error);
      alert('Failed to create investment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvestment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this investment?')) return;

    setLoading(true);
    try {
      await deleteInvestment(id);
      setInvestments(investments.filter((inv) => inv.id !== id));
      window.location.reload();
    } catch (error) {
      console.error('Error deleting investment:', error);
      alert('Failed to delete investment');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      // Trigger a revalidation by reloading the page
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing prices:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
          variant="primary"
        >
          <Plus className="h-4 w-4" />
          Add Investment
        </Button>
        <Button
          onClick={handleRefreshPrices}
          disabled={refreshing}
          className="flex items-center gap-2"
          variant="secondary"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Prices'}
        </Button>
      </div>

      {/* Add Investment Form */}
      {showForm && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Add New Investment</h3>
          <form onSubmit={handleAddInvestment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Apple Inc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">
                  Symbol *
                </label>
                <input
                  type="text"
                  placeholder="e.g., AAPL, BTC-USD"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {INVESTMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  placeholder="USD"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  placeholder="e.g., 10"
                  step="0.00001"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">
                  Buy Price *
                </label>
                <input
                  type="number"
                  placeholder="e.g., 150"
                  step="0.01"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">
                Notes
              </label>
              <textarea
                placeholder="Optional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} variant="primary">
                {loading ? 'Adding...' : 'Add Investment'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
