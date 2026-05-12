// Investment price fetching utility with caching
// Uses multiple free APIs: CoinGecko for crypto, mock data for stocks

const PRICE_CACHE = new Map<string, { price: number; currency: string; changePercent?: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Mock stock data for demo (replace with real API in production)
const MOCK_STOCK_PRICES: Record<string, { price: number; changePercent: number }> = {
  'AAPL': { price: 189.95, changePercent: 1.25 },
  'MSFT': { price: 428.10, changePercent: 0.85 },
  'GOOGL': { price: 142.80, changePercent: -0.45 },
  'AMZN': { price: 180.50, changePercent: 1.10 },
  'TSLA': { price: 242.30, changePercent: -0.95 },
  'META': { price: 510.25, changePercent: 2.15 },
  'NFLX': { price: 440.15, changePercent: 0.65 },
  'NVDA': { price: 876.50, changePercent: 1.55 },
  'JPM': { price: 195.75, changePercent: 0.35 },
  'JNJ': { price: 158.90, changePercent: -0.15 },
  // Indian stocks
  'RELIANCE.NS': { price: 2850.45, changePercent: 0.75 },
  'TCS.NS': { price: 3540.25, changePercent: 1.20 },
  'INFY.NS': { price: 1445.80, changePercent: 0.50 },
  'SBIN.NS': { price: 555.60, changePercent: 0.95 },
};

// Crypto symbols and their CoinGecko IDs
const CRYPTO_IDS: Record<string, string> = {
  'BTC-USD': 'bitcoin',
  'BTC': 'bitcoin',
  'ETH-USD': 'ethereum',
  'ETH': 'ethereum',
  'BNB-USD': 'binancecoin',
  'BNB': 'binancecoin',
  'XRP-USD': 'ripple',
  'XRP': 'ripple',
  'SOL-USD': 'solana',
  'SOL': 'solana',
  'ADA-USD': 'cardano',
  'ADA': 'cardano',
  'DOGE-USD': 'dogecoin',
  'DOGE': 'dogecoin',
  'DOT-USD': 'polkadot',
  'DOT': 'polkadot',
};

/**
 * Get live price for a symbol
 * Supports stocks, crypto, and mutual funds
 */
export async function getLivePrice(
  symbol: string
): Promise<{ price: number; currency: string; changePercent?: number } | null> {
  if (!symbol) return null;

  const cacheKey = symbol.toUpperCase();
  const cached = PRICE_CACHE.get(cacheKey);

  // Return cached price if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      price: cached.price,
      currency: cached.currency,
      changePercent: cached.changePercent
    };
  }

  try {
    // Check if it's a crypto symbol
    const cryptoId = CRYPTO_IDS[cacheKey];
    if (cryptoId) {
      return await getCryptoPriceFromCoinGecko(symbol, cryptoId);
    }

    // Check if it's a stock symbol
    if (MOCK_STOCK_PRICES[cacheKey]) {
      return getMockStockPrice(symbol);
    }

    // Fallback: try to fetch as stock (will fail gracefully)
    return getMockStockPrice(symbol);
  } catch (error) {
    console.error(`Failed to get price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch crypto price from CoinGecko API (free, no auth needed)
 */
async function getCryptoPriceFromCoinGecko(
  symbol: string,
  cryptoId: string
): Promise<{ price: number; currency: string; changePercent?: number } | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=true`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const cryptoData = data[cryptoId];

    if (!cryptoData || !cryptoData.usd) {
      return null;
    }

    const price = cryptoData.usd;
    const changePercent = cryptoData.usd_24h_change;

    // Cache the result
    PRICE_CACHE.set(symbol.toUpperCase(), {
      price,
      currency: 'USD',
      changePercent,
      timestamp: Date.now()
    });

    return { price, currency: 'USD', changePercent };
  } catch (error) {
    console.error(`CoinGecko fetch error for ${cryptoId}:`, error);
    return null;
  }
}

/**
 * Get mock stock price for demo
 * In production, replace with real API like Alpha Vantage or Yahoo Finance
 */
function getMockStockPrice(
  symbol: string
): { price: number; currency: string; changePercent?: number } | null {
  const upperSymbol = symbol.toUpperCase();
  const mockData = MOCK_STOCK_PRICES[upperSymbol];

  if (!mockData) {
    console.warn(`No mock data for ${symbol}`);
    return null;
  }

  // Cache the result
  PRICE_CACHE.set(upperSymbol, {
    price: mockData.price,
    currency: 'USD',
    changePercent: mockData.changePercent,
    timestamp: Date.now()
  });

  return {
    price: mockData.price,
    currency: 'USD',
    changePercent: mockData.changePercent
  };
}

/**
 * Get prices for multiple symbols
 */
export async function getLivePrices(
  symbols: string[]
): Promise<Record<string, { price: number; currency: string; changePercent?: number } | null>> {
  const results: Record<string, { price: number; currency: string; changePercent?: number } | null> = {};

  for (const symbol of symbols) {
    results[symbol] = await getLivePrice(symbol);
  }

  return results;
}

/**
 * Calculate investment performance
 */
export function calculatePerformance(
  quantity: number,
  buyPrice: number,
  currentPrice: number
): {
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
} {
  const totalInvested = quantity * buyPrice;
  const currentValue = quantity * currentPrice;
  const profitLoss = currentValue - totalInvested;
  const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return {
    totalInvested,
    currentValue,
    profitLoss,
    profitLossPercent
  };
}
