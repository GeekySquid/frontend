import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols') || 'NVDA,AAPL,MSFT,GOOGL,TSLA';
  
  try {
    // Using Steady API for real stock data
    const symbolList = symbols.split(',');
    const stockPromises = symbolList.map(async (symbol) => {
      try {
        const response = await fetch(
          `https://api.steady.com/v1/stocks/${symbol}/quote`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.STEADY_API_KEY}`,
              'Content-Type': 'application/json'
            },
            next: { revalidate: 30 } // Cache for 30 seconds for real-time feel
          }
        );
        
        if (!response.ok) {
          console.log(`Steady API failed for ${symbol}, status: ${response.status}`);
          throw new Error(`Failed to fetch ${symbol} from Steady API`);
        }
        
        const data = await response.json();
        
        return {
          symbol: symbol,
          name: getCompanyName(symbol),
          price: data.price || data.last_price || data.current_price,
          change: data.change || data.price_change,
          changePercent: data.change_percent || data.percent_change,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`Error fetching ${symbol} from Steady:`, error);
        // Fallback to mock data for this symbol
        return getMockStockData(symbol);
      }
    });

    const stocks = await Promise.all(stockPromises);
    
    return NextResponse.json({
      data: stocks,
      timestamp: new Date().toISOString(),
      source: 'steady-api'
    });
  } catch (error) {
    console.error('Stocks API Error:', error);
    
    // Fallback to mock data
    const symbolList = symbols.split(',');
    const mockStocks = symbolList.map(symbol => getMockStockData(symbol));
    
    return NextResponse.json({
      data: mockStocks,
      fallback: true,
      timestamp: new Date().toISOString(),
      source: 'mock-data'
    });
  }
}

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

function getMockStockData(symbol: string) {
  const baseData: { [key: string]: { price: number; change: number } } = {
    'NVDA': { price: 185.33 + (Math.random() - 0.5) * 10, change: -10.23 + (Math.random() - 0.5) * 5 },
    'AAPL': { price: 271.45 + (Math.random() - 0.5) * 8, change: 2.15 + (Math.random() - 0.5) * 3 },
    'MSFT': { price: 445.67 + (Math.random() - 0.5) * 12, change: 5.23 + (Math.random() - 0.5) * 4 },
    'GOOGL': { price: 178.92 + (Math.random() - 0.5) * 6, change: -1.45 + (Math.random() - 0.5) * 2 },
    'TSLA': { price: 234.56 + (Math.random() - 0.5) * 15, change: 8.91 + (Math.random() - 0.5) * 6 }
  };

  const base = baseData[symbol] || { 
    price: 100 + Math.random() * 200, 
    change: (Math.random() - 0.5) * 10 
  };
  
  const changePercent = (base.change / base.price) * 100;

  return {
    symbol,
    name: getCompanyName(symbol),
    price: parseFloat(base.price.toFixed(2)),
    change: parseFloat(base.change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    timestamp: Date.now()
  };
}