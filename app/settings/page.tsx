'use client';

import { useTheme } from '../../components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { SUPPORTED_CURRENCIES } from '../../lib/currency';
import { setBaseCurrency, setDefaultRemindAfterDays, setTaxPreferences } from '../../lib/settingsActions';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [baseCurrency, setBaseCurrencyLocal] = useState('USD');
  const [defaultRemindAfterDays, setDefaultRemindAfterDaysLocal] = useState(30);
  const [taxRegime, setTaxRegimeLocal] = useState('NEW');
  const [taxCountry, setTaxCountryLocal] = useState('India');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load the current preferences
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/settings/currency', { method: 'GET' });
        if (response.ok) {
          const data = await response.json();
          setBaseCurrencyLocal(data.baseCurrency || 'USD');
          setDefaultRemindAfterDaysLocal(Number(data.defaultRemindAfterDays ?? 30));
        }
      } catch (error) {
        console.error('Failed to load currency preference:', error);
      }

      try {
        const taxResponse = await fetch('/api/settings/tax', { method: 'GET' });
        if (taxResponse.ok) {
          const taxData = await taxResponse.json();
          setTaxRegimeLocal(taxData.regime || 'NEW');
          setTaxCountryLocal(taxData.country || 'India');
        }
      } catch (error) {
        console.error('Failed to load tax preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  const handleCurrencyChange = async (currency: string) => {
    setLoading(true);
    setMessage('');
    try {
      await setBaseCurrency(currency);
      setBaseCurrencyLocal(currency);
      setMessage('Currency preference saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save currency:', error);
      setMessage('Failed to save currency preference');
    } finally {
      setLoading(false);
    }
  };

  const handleTaxPreferencesChange = async (regime: string, country: string) => {
    setLoading(true);
    setMessage('');
    try {
      await setTaxPreferences(regime as 'OLD' | 'NEW', country);
      setTaxRegimeLocal(regime);
      setTaxCountryLocal(country);
      setMessage('Tax preferences saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save tax preferences:', error);
      setMessage('Failed to save tax preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleDefaultRemindAfterDaysChange = async (days: number) => {
    setLoading(true);
    setMessage('');
    try {
      await setDefaultRemindAfterDays(days);
      setDefaultRemindAfterDaysLocal(days);
      setMessage('Default reminder interval saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save default reminder interval:', error);
      setMessage('Failed to save default reminder interval');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-sm text-gray-600 dark:text-gray-500">Configure your LifeOS preferences.</p>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Preferences</h3>
          <div className="mt-4 space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Theme</div>
              <Button onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} variant="secondary">
                {theme === 'dark' ? (
                  <>
                    <Moon className="h-4 w-4" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4" />
                    Light Mode
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">{theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}</p>
            </div>
            <div>
              <label htmlFor="currency-select" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Base Currency</label>
              <p className="text-xs text-gray-600 dark:text-gray-500 mb-2">Used for converting multi-currency account totals</p>
              <select 
                id="currency-select" 
                value={baseCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                disabled={loading}
                className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-50"
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
              {message && (
                <p className={`text-xs mt-2 ${message.includes('Failed') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="default-remind-days" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Default remind after (days)</label>
              <p className="text-xs text-gray-600 dark:text-gray-500 mb-2">Used for new contacts when no custom reminder interval is provided</p>
              <div className="flex items-center gap-2">
                <input
                  id="default-remind-days"
                  type="number"
                  min="1"
                  step="1"
                  value={defaultRemindAfterDays}
                  onChange={(e) => setDefaultRemindAfterDaysLocal(Math.max(1, Number(e.target.value) || 1))}
                  className="w-28 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                />
                <Button
                  onClick={() => handleDefaultRemindAfterDaysChange(defaultRemindAfterDays)}
                  disabled={loading}
                  variant="secondary"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tax Estimation</h3>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="tax-regime-select" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">
                Preferred Tax Regime
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-500 mb-2">Used for tax estimation calculations</p>
              <select 
                id="tax-regime-select" 
                value={taxRegime}
                onChange={(e) => handleTaxPreferencesChange(e.target.value, taxCountry)}
                disabled={loading}
                className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-50"
              >
                <option value="NEW">New Regime (FY 2025-26)</option>
                <option value="OLD">Old Regime (FY 2025-26)</option>
              </select>
            </div>
            <div>
              <label htmlFor="tax-country-select" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">
                Tax Country
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-500 mb-2">Currently supports India only</p>
              <select 
                id="tax-country-select" 
                value={taxCountry}
                onChange={(e) => handleTaxPreferencesChange(taxRegime, e.target.value)}
                disabled={true}
                className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-50"
              >
                <option value="India">India</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
