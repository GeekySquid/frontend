import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tickers, investment = 10000, action = 'predict' } = body;

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of stock tickers' },
        { status: 400 }
      );
    }

    // Validate tickers
    const validTickers = tickers.filter(t => typeof t === 'string' && t.length > 0);
    if (validTickers.length === 0) {
      return NextResponse.json(
        { error: 'No valid tickers provided' },
        { status: 400 }
      );
    }

    const tickersString = validTickers.join(',');
    const scriptPath = path.join(process.cwd(), 'python', 'portfolio_optimizer.py');

    // Execute Python script
    const command = action === 'optimize'
      ? `python "${scriptPath}" optimize "${tickersString}"`
      : `python "${scriptPath}" predict "${tickersString}" ${investment}`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 second timeout
    });

    if (stderr && !stderr.includes('FutureWarning')) {
      console.error('Python script error:', stderr);
    }

    const result = JSON.parse(stdout);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Portfolio analysis error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to analyze portfolio',
        details: error.message,
        suggestion: 'Make sure Python and required packages (yfinance, pypfopt) are installed'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Portfolio Analysis API',
    endpoints: {
      POST: {
        description: 'Analyze and optimize portfolio',
        body: {
          tickers: 'Array of stock symbols (e.g., ["AAPL", "MSFT", "GOOGL"])',
          investment: 'Investment amount in USD (default: 10000)',
          action: '"optimize" or "predict" (default: "predict")'
        },
        example: {
          tickers: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
          investment: 10000,
          action: 'predict'
        }
      }
    }
  });
}
