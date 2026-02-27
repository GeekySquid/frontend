import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock market indices data (in production, you'd fetch from a real API)
    const indices = [
      {
        symbol: 'SPX',
        name: 'S&P 500',
        price: 6872.78,
        change: -73.34,
        changePercent: -1.06,
        timestamp: Date.now()
      },
      {
        symbol: 'DJI',
        name: 'Dow Jones',
        price: 24878.08,
        change: -450.97,
        changePercent: -1.78,
        timestamp: Date.now()
      },
      {
        symbol: 'IXIC',
        name: 'NASDAQ',
        price: 49320.32,
        change: -181.83,
        changePercent: -0.37,
        timestamp: Date.now()
      },
      {
        symbol: 'VIX',
        name: 'Volatility',
        price: 20.17,
        change: 7.24,
        changePercent: 19.49,
        timestamp: Date.now()
      },
      {
        symbol: 'DXY',
        name: 'Dollar Index',
        price: 97.946,
        change: 0.303,
        changePercent: 0.31,
        timestamp: Date.now()
      }
    ];

    // Add some randomization to simulate real-time changes
    const updatedIndices = indices.map(index => ({
      ...index,
      price: index.price + (Math.random() - 0.5) * 2,
      change: index.change + (Math.random() - 0.5) * 0.5,
      changePercent: index.changePercent + (Math.random() - 0.5) * 0.1,
      timestamp: Date.now()
    }));

    return NextResponse.json({
      data: updatedIndices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market Indices API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market indices' },
      { status: 500 }
    );
  }
}