import { NextResponse } from 'next/server';
import { scheduleAlphaVantageRequest, alphaVantageRateLimiter, createCacheKey } from '@/lib/rateLimiter';

// Apify API integration for real-time Yahoo Finance data
async function fetchApifyYahooFinanceData(symbols: string[]) {
  try {
    const apiKey = process.env.APIFY_API_KEY;
    if (!apiKey) {
      console.log('Apify API key not configured, skipping...');
      return null;
    }

    // Apify Yahoo Finance Actor endpoint
    const actorId = 'canadesk/yahoo-finance';
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`;
    
    const requestBody = {
      tickers: symbols,
      proxy: { useApifyProxy: true },
      process: 'quote', // Get quote data
      delay: 1
    };

    console.log(`🚀 Fetching Apify data for symbols: ${symbols.join(', ')}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Apify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Apify response received for ${symbols.length} symbols`);

    // Parse Apify Yahoo Finance response
    const parsedData = data.map((item: any) => {
      if (item.type === 'quote' && item.data) {
        const quote = item.data;
        return {
          symbol: item.ticker || quote.symbol,
          name: quote.longName || quote.shortName || getCompanyName(item.ticker),
          price: parseFloat(quote.regularMarketPrice || quote.price || 0),
          change: parseFloat(quote.regularMarketChange || quote.change || 0),
          changePercent: parseFloat(quote.regularMarketChangePercent || quote.changePercent || 0),
          volume: parseInt(quote.regularMarketVolume || quote.volume || 0),
          high: parseFloat(quote.regularMarketDayHigh || quote.dayHigh || 0),
          low: parseFloat(quote.regularMarketDayLow || quote.dayLow || 0),
          open: parseFloat(quote.regularMarketOpen || quote.open || 0),
          previousClose: parseFloat(quote.regularMarketPreviousClose || quote.previousClose || 0),
          marketCap: quote.marketCap || null,
          timestamp: Date.now(),
          source: 'apify-yahoo-finance'
        };
      }
      return null;
    }).filter(Boolean);

    return parsedData;
  } catch (error) {
    console.error('Apify Yahoo Finance error:', error);
    return null;
  }
}

// Alpha Vantage API integration for real-time data with rate limiting
async function fetchAlphaVantageData(symbol: string) {
  const requestFn = async () => {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey || apiKey === 'demo') {
      console.log('Alpha Vantage API key not configured, skipping...');
      return null;
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const response = await fetch(url, {
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check for API limit or error
    if (data['Error Message'] || data['Note'] || data['Information']) {
      const message = data['Error Message'] || data['Note'] || data['Information'];
      console.log(`⚠️ Alpha Vantage limit/error for ${symbol}:`, message);
      return null;
    }

    const quote = data['Global Quote'];
    if (!quote) {
      console.log(`No quote data from Alpha Vantage for ${symbol}`);
      return null;
    }

    // Parse Alpha Vantage response
    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
    const volume = parseInt(quote['06. volume']);
    const high = parseFloat(quote['03. high']);
    const low = parseFloat(quote['04. low']);
    const open = parseFloat(quote['02. open']);
    const previousClose = parseFloat(quote['08. previous close']);

    return {
      symbol,
      name: getCompanyName(symbol),
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume,
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      open: parseFloat(open.toFixed(2)),
      previousClose: parseFloat(previousClose.toFixed(2)),
      timestamp: Date.now(),
      source: 'alpha-vantage'
    };
  };

  // Use the rate-limited scheduler
  return await scheduleAlphaVantageRequest(requestFn, symbol, 1); // Cache for 1 minute
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'stocks';
  const symbols = searchParams.get('symbols') || 'NVDA,AAPL,MSFT,GOOGL,TSLA';
  
  try {
    switch (type) {
      case 'stocks':
        return await getStockData(symbols);
      case 'indices':
        return await getIndicesData();
      case 'crypto':
        return await getCryptoData(symbols);
      case 'forex':
        return await getForexData(symbols);
      default:
        return await getStockData(symbols);
    }
  } catch (error) {
    console.error('Live Data API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live data', fallback: true },
      { status: 500 }
    );
  }
}

async function getStockData(symbols: string) {
  const symbolList = symbols.split(',');

  try {
    // Try Apify Yahoo Finance first (real-time data)
    console.log(`🎯 Attempting Apify Yahoo Finance for: ${symbolList.join(', ')}`);
    const apifyData = await fetchApifyYahooFinanceData(symbolList);

    if (apifyData && apifyData.length > 0) {
      console.log(`✅ Apify Yahoo Finance success: ${apifyData.length} stocks`);
      return NextResponse.json({
        data: apifyData,
        timestamp: new Date().toISOString(),
        source: 'apify-yahoo-finance',
        type: 'stocks'
      });
    }
  } catch (error) {
    console.error('❌ Apify Yahoo Finance failed:', error);
  }

  // Fallback to individual Alpha Vantage requests
  const stockPromises = symbolList.map(async (symbol) => {
    try {
      // Try Alpha Vantage first (real data)
      const alphaVantageData = await fetchAlphaVantageData(symbol);
      if (alphaVantageData) {
        console.log(`✅ Alpha Vantage data fetched for ${symbol}: $${alphaVantageData.price}`);
        return alphaVantageData;
      }

      // Try Steady API endpoints as fallback
      const endpoints = [
        `https://api.steady.com/v1/stocks/${symbol}/quote`,
        `https://api.steady.com/v1/market/stocks/${symbol}`,
        `https://steady-api.com/v1/quotes/${symbol}`
      ];

      for (const endpoint of endpoints) {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          
          if (process.env.STEADY_API_KEY) {
            headers['Authorization'] = `Bearer ${process.env.STEADY_API_KEY}`;
            headers['X-API-Key'] = process.env.STEADY_API_KEY;
          }
          
          const response = await fetch(endpoint, {
            headers,
            next: { revalidate: 30 }
          });

          if (response.ok) {
            const data = await response.json();
            return parseStockData(symbol, data, 'steady-api');
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed for ${symbol}`);
          continue;
        }
      }

      throw new Error(`All endpoints failed for ${symbol}`);
    } catch (error) {
      console.error(`❌ Error fetching ${symbol}:`, error);
      console.log(`🔄 Using mock data for ${symbol}`);
      return getMockStockData(symbol);
    }
  });

  const stocks = await Promise.all(stockPromises);

  return NextResponse.json({
    data: stocks,
    timestamp: new Date().toISOString(),
    source: stocks.some(s => s.source === 'alpha-vantage') ? 'alpha-vantage' :
            stocks.some(s => s.source === 'apify-yahoo-finance') ? 'apify-yahoo-finance' : 'enhanced-mock',
    type: 'stocks',
    note: stocks.every(s => s.source === 'enhanced-mock') ? 'Using enhanced mock data due to API limits' : undefined
  });
}


async function getIndicesData() {
  try {
    const response = await fetch('https://api.steady.com/v1/market/indices', {
      headers: {
        'Authorization': `Bearer ${process.env.STEADY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 60 }
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        data: parseIndicesData(data),
        timestamp: new Date().toISOString(),
        source: 'steady-api',
        type: 'indices'
      });
    }
  } catch (error) {
    console.error('Indices API Error:', error);
  }

  // Fallback to mock indices data
  return NextResponse.json({
    data: getMockIndicesData(),
    timestamp: new Date().toISOString(),
    source: 'mock-data',
    type: 'indices',
    fallback: true
  });
}

async function getCryptoData(symbols: string) {
  const cryptoSymbols = symbols.split(',');
  const cryptoPromises = cryptoSymbols.map(async (symbol) => {
    try {
      const response = await fetch(`https://api.steady.com/v1/crypto/${symbol}`, {
        headers: {
          'Authorization': `Bearer ${process.env.STEADY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        next: { revalidate: 30 }
      });

      if (response.ok) {
        const data = await response.json();
        return parseCryptoData(symbol, data);
      }
    } catch (error) {
      console.error(`Error fetching crypto ${symbol}:`, error);
    }
    
    return getMockCryptoData(symbol);
  });

  const crypto = await Promise.all(cryptoPromises);
  
  return NextResponse.json({
    data: crypto,
    timestamp: new Date().toISOString(),
    source: 'steady-api',
    type: 'crypto'
  });
}

async function getForexData(symbols: string) {
  const forexPairs = symbols.split(',');
  const forexPromises = forexPairs.map(async (pair) => {
    try {
      const response = await fetch(`https://api.steady.com/v1/forex/${pair}`, {
        headers: {
          'Authorization': `Bearer ${process.env.STEADY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        next: { revalidate: 30 }
      });

      if (response.ok) {
        const data = await response.json();
        return parseForexData(pair, data);
      }
    } catch (error) {
      console.error(`Error fetching forex ${pair}:`, error);
    }
    
    return getMockForexData(pair);
  });

  const forex = await Promise.all(forexPromises);
  
  return NextResponse.json({
    data: forex,
    timestamp: new Date().toISOString(),
    source: 'steady-api',
    type: 'forex'
  });
}

// Data parsing functions
function parseStockData(symbol: string, data: any, source: string = 'api') {
  return {
    symbol: symbol,
    name: getCompanyName(symbol),
    price: data.price || data.last_price || data.current_price || data.quote?.price,
    change: data.change || data.price_change || data.quote?.change,
    changePercent: data.change_percent || data.percent_change || data.quote?.change_percent,
    volume: data.volume || data.quote?.volume,
    high: data.high || data.day_high || data.quote?.high,
    low: data.low || data.day_low || data.quote?.low,
    timestamp: Date.now(),
    source
  };
}

function parseIndicesData(data: any) {
  if (Array.isArray(data)) {
    return data.map(index => ({
      symbol: index.symbol,
      name: index.name,
      price: index.price || index.value,
      change: index.change,
      changePercent: index.change_percent,
      timestamp: Date.now()
    }));
  }
  return getMockIndicesData();
}

function parseCryptoData(symbol: string, data: any) {
  return {
    symbol: symbol,
    name: getCryptoName(symbol),
    price: data.price || data.current_price,
    change: data.change || data.price_change_24h,
    changePercent: data.change_percent || data.price_change_percentage_24h,
    marketCap: data.market_cap,
    volume: data.volume_24h,
    timestamp: Date.now()
  };
}

function parseForexData(pair: string, data: any) {
  return {
    symbol: pair,
    name: pair,
    price: data.rate || data.price,
    change: data.change,
    changePercent: data.change_percent,
    timestamp: Date.now()
  };
}

// Helper functions
function getCompanyName(symbol: string): string {
  const companies: { [key: string]: string } = {
    'NVDA': 'NVIDIA Corp',
    'AAPL': 'Apple Inc',
    'MSFT': 'Microsoft Corp',
    'GOOGL': 'Alphabet Inc',
    'TSLA': 'Tesla Inc',
    'AMZN': 'Amazon.com Inc',
    'META': 'Meta Platforms',
    'NFLX': 'Netflix Inc',
    'AMD': 'Advanced Micro Devices',
    'INTC': 'Intel Corp'
  };
  return companies[symbol] || symbol;
}

function getCryptoName(symbol: string): string {
  const cryptos: { [key: string]: string } = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'ADA': 'Cardano',
    'SOL': 'Solana',
    'DOT': 'Polkadot'
  };
  return cryptos[symbol] || symbol;
}

// Mock data functions
function getMockStockData(symbol: string) {
  const baseData: { [key: string]: { price: number; change: number } } = {
    'NVDA': { price: 185.33, change: -10.23 },
    'AAPL': { price: 271.45, change: 2.15 },
    'MSFT': { price: 445.67, change: 5.23 },
    'GOOGL': { price: 178.92, change: -1.45 },
    'TSLA': { price: 234.56, change: 8.91 },
    'AMZN': { price: 189.23, change: -3.45 },
    'META': { price: 512.78, change: 12.34 },
    'NFLX': { price: 678.90, change: -8.76 },
    'AMD': { price: 156.78, change: 4.32 },
    'INTC': { price: 45.67, change: -1.23 }
  };

  const base = baseData[symbol] || { 
    price: 100 + Math.random() * 200, 
    change: (Math.random() - 0.5) * 10 
  };
  
  // Add realistic market-hours variation (smaller during market hours)
  const now = new Date();
  const hour = now.getHours();
  const isMarketHours = hour >= 9 && hour <= 16; // Rough market hours
  const volatility = isMarketHours ? 0.5 : 2.0; // Less volatile during market hours
  
  // Add some randomization for live feel with realistic constraints
  const priceVariation = (Math.random() - 0.5) * volatility;
  const changeVariation = (Math.random() - 0.5) * 0.5;
  
  const price = Math.max(0.01, base.price + priceVariation);
  const change = base.change + changeVariation;
  const changePercent = (change / (price - change)) * 100;
  
  // Generate realistic volume based on stock popularity
  const baseVolume = baseData[symbol] ? 
    (symbol === 'NVDA' || symbol === 'AAPL' || symbol === 'TSLA' ? 50000000 : 20000000) : 
    10000000;
  const volume = Math.floor(baseVolume + (Math.random() - 0.5) * baseVolume * 0.3);

  return {
    symbol,
    name: getCompanyName(symbol),
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    volume,
    high: parseFloat((price + Math.abs(change) * 0.5 + Math.random() * 2).toFixed(2)),
    low: parseFloat((price - Math.abs(change) * 0.5 - Math.random() * 2).toFixed(2)),
    open: parseFloat((price - change + (Math.random() - 0.5) * 1).toFixed(2)),
    previousClose: parseFloat((price - change).toFixed(2)),
    timestamp: Date.now(),
    source: 'enhanced-mock'
  };
}

function getMockIndicesData() {
  return [
    {
      symbol: 'SPX',
      name: 'S&P 500',
      price: 6872.78 + (Math.random() - 0.5) * 20,
      change: -73.34 + (Math.random() - 0.5) * 10,
      changePercent: -1.06 + (Math.random() - 0.5) * 0.5,
      timestamp: Date.now()
    },
    {
      symbol: 'DJI',
      name: 'Dow Jones',
      price: 24878.08 + (Math.random() - 0.5) * 50,
      change: -450.97 + (Math.random() - 0.5) * 20,
      changePercent: -1.78 + (Math.random() - 0.5) * 0.5,
      timestamp: Date.now()
    },
    {
      symbol: 'IXIC',
      name: 'NASDAQ',
      price: 49320.32 + (Math.random() - 0.5) * 100,
      change: -181.83 + (Math.random() - 0.5) * 30,
      changePercent: -0.37 + (Math.random() - 0.5) * 0.3,
      timestamp: Date.now()
    },
    {
      symbol: 'VIX',
      name: 'Volatility',
      price: 20.17 + (Math.random() - 0.5) * 2,
      change: 7.24 + (Math.random() - 0.5) * 1,
      changePercent: 19.49 + (Math.random() - 0.5) * 2,
      timestamp: Date.now()
    },
    {
      symbol: 'DXY',
      name: 'Dollar Index',
      price: 97.946 + (Math.random() - 0.5) * 1,
      change: 0.303 + (Math.random() - 0.5) * 0.2,
      changePercent: 0.31 + (Math.random() - 0.5) * 0.1,
      timestamp: Date.now()
    }
  ];
}

function getMockCryptoData(symbol: string) {
  const baseData: { [key: string]: { price: number; change: number } } = {
    'BTC': { price: 45000, change: 1200 },
    'ETH': { price: 3200, change: -150 },
    'ADA': { price: 0.85, change: 0.05 },
    'SOL': { price: 120, change: 8 },
    'DOT': { price: 25, change: -2 }
  };

  const base = baseData[symbol] || { price: Math.random() * 1000, change: (Math.random() - 0.5) * 100 };
  const changePercent = (base.change / base.price) * 100;

  return {
    symbol,
    name: getCryptoName(symbol),
    price: base.price,
    change: base.change,
    changePercent: changePercent,
    marketCap: base.price * Math.random() * 1000000000,
    volume: Math.random() * 1000000000,
    timestamp: Date.now()
  };
}

function getMockForexData(pair: string) {
  const baseRates: { [key: string]: number } = {
    'EURUSD': 1.0850,
    'GBPUSD': 1.2650,
    'USDJPY': 149.50,
    'USDCAD': 1.3450,
    'AUDUSD': 0.6750
  };

  const rate = baseRates[pair] || 1.0000;
  const change = (Math.random() - 0.5) * 0.01;
  const changePercent = (change / rate) * 100;

  return {
    symbol: pair,
    name: pair,
    price: parseFloat((rate + change).toFixed(4)),
    change: parseFloat(change.toFixed(4)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    timestamp: Date.now()
  };
}