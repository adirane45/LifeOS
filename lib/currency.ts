// Currency exchange rate fetching and conversion utilities
// Using frankfurter.app (free, no API key needed)

const EXCHANGE_RATE_CACHE = new Map<string, { rate: number; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Fetches live exchange rate from frankfurter.app
 * Caches results to avoid hitting the API too frequently
 */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  // If currencies are the same, return 1
  if (from === to) return 1;

  const cacheKey = `${from}-${to}`;
  const cached = EXCHANGE_RATE_CACHE.get(cacheKey);

  // Return cached rate if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rate;
  }

  try {
    const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, {
      next: { revalidate: 3600 } // Cache for 1 hour at the fetch level
    });

    if (!response.ok) {
      console.error(`Exchange rate fetch failed: ${response.status}`);
      return 1; // Fallback to 1:1 if API fails
    }

    const data = await response.json();

    if (data.rates && data.rates[to] !== undefined) {
      const rate = data.rates[to];
      // Cache the result
      EXCHANGE_RATE_CACHE.set(cacheKey, { rate, timestamp: Date.now() });
      return rate;
    }

    console.error('Invalid exchange rate response:', data);
    return 1; // Fallback to 1:1
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return 1; // Fallback to 1:1 if network error
  }
}

/**
 * Converts an amount from one currency to another
 * If rate is not provided, fetches it from the API
 */
export async function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate?: number
): Promise<number> {
  if (!rate) {
    rate = await getExchangeRate(fromCurrency, toCurrency);
  }
  return amount * rate;
}

/**
 * Converts an amount synchronously using a provided rate
 * This is useful when you already have the rate and want to avoid async/await
 */
export function convertAmountSync(
  amount: number,
  rate: number
): number {
  return amount * rate;
}

/**
 * Gets all supported currencies
 * (Common currencies for the app)
 */
export const SUPPORTED_CURRENCIES = [
  'INR', // Indian Rupee
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
  'JPY', // Japanese Yen
  'AUD', // Australian Dollar
  'CAD', // Canadian Dollar
  'CHF', // Swiss Franc
  'CNY', // Chinese Yuan
  'SEK', // Swedish Krona
  'NZD', // New Zealand Dollar
  'MXN'  // Mexican Peso
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

/**
 * Gets the currency symbol for display
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'INR': '₹',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'CNY': '¥',
    'SEK': 'kr',
    'NZD': 'NZ$',
    'MXN': '$'
  };
  return symbols[currency] || currency;
}

/**
 * Formats a currency value for display
 */
export function formatCurrencyValue(
  amount: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    // Fallback if currency code is invalid
    return `${getCurrencySymbol(currency)}${amount.toFixed(2)}`;
  }
}
