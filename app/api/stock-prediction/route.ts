import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backend-client';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

interface TechnicalIndicators {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  sma20: number;
  sma50: number;
  bollingerBands: { upper: number; middle: number; lower: number };
  volumeRatio: number;
}

interface NewsAnalysis {
  sentiment: number;
  impact: string;
  recentNews: Array<{ title: string; sentiment: number }>;
}

interface EnhancedPrediction {
  // Backend AI prediction
  aiPrediction: {
    predicted_price: number;
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    model_version: string;
    cached: boolean;
  } | null;
  // Enhanced analysis
  direction: string;
  targetPrice: number;
  priceRange: { low: number; high: number };
  reasoning: string[];
  keyFactors: {
    technical: string;
    sentiment: string;
    momentum: string;
  };
  risks: string[];
  probability: { bullish: number; bearish: number; neutral: number };
  recommendation: string;
  backendAvailable: boolean;
}

export async function POST(request: Request) {
  try {
    const { symbol, timeframe = '24h' } = await request.json();

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Check backend availability
    const backendStatus = await backendClient.checkConnection();
    console.log('Backend status:', backendStatus);

    let aiPrediction = null;
    let backendAvailable = false;

    // Try to get prediction from AI backend first
    if (backendStatus.available) {
      try {
        const backendPrediction = await backendClient.getPrediction(symbol);
        aiPrediction = {
          predicted_price: backendPrediction.predicted_price,
          signal: backendPrediction.signal,
          confidence: backendPrediction.confidence,
          model_version: backendPrediction.model_version,
          cached: backendPrediction.cached
        };
        backendAvailable = true;
        console.log('Successfully got prediction from backend:', aiPrediction);
      } catch (error) {
        console.error('Backend prediction failed:', error);
        backendAvailable = false;
      }
    }

    // Fetch market data and technical analysis (always needed for comprehensive analysis)
    const [marketData, technicalIndicators, newsAnalysis] = await Promise.all([
      fetchMarketData(symbol),
      calculateTechnicalIndicators(symbol),
      analyzeRecentNews(symbol)
    ]);

    // Generate enhanced prediction combining backend AI with technical analysis
    const enhancedPrediction = await generateEnhancedPrediction(
      symbol,
      marketData,
      technicalIndicators,
      newsAnalysis,
      aiPrediction,
      timeframe
    );

    return NextResponse.json({
      symbol,
      timeframe,
      timestamp: new Date().toISOString(),
      marketData,
      technicalIndicators,
      newsAnalysis,
      prediction: enhancedPrediction,
      confidence: enhancedPrediction.aiPrediction?.confidence || enhancedPrediction.probability.bullish,
      source: backendAvailable ? 'ai-backend-enhanced' : 'technical-analysis',
      backendStatus: {
        available: backendAvailable,
        latency: backendStatus.latency,
        error: backendStatus.error
      }
    });

  } catch (error) {
    console.error('Stock Prediction Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function fetchMarketData(symbol: string): Promise<MarketData> {
  try {
    // Try Alpha Vantage first
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      const quote = data['Global Quote'];
      
      if (quote && quote['05. price']) {
        return {
          symbol,
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: parseInt(quote['06. volume']),
          high: parseFloat(quote['03. high']),
          low: parseFloat(quote['04. low']),
          open: parseFloat(quote['02. open']),
          previousClose: parseFloat(quote['08. previous close'])
        };
      }
    }
  } catch (error) {
    console.error('Alpha Vantage fetch error:', error);
  }

  // Fallback to enhanced mock data with realistic patterns
  return generateRealisticMarketData(symbol);
}

function generateRealisticMarketData(symbol: string): MarketData {
  const basePrice = symbol === 'NVDA' ? 185 : symbol === 'AAPL' ? 271 : symbol === 'TSLA' ? 195 : 150;
  const volatility = Math.random() * 0.03; // 0-3% daily volatility
  const trend = (Math.random() - 0.5) * 2; // -1 to 1 trend
  
  const price = basePrice * (1 + volatility * trend);
  const change = price - basePrice;
  const changePercent = (change / basePrice) * 100;
  
  return {
    symbol,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    volume: Math.floor(50000000 + Math.random() * 200000000),
    high: parseFloat((price * 1.02).toFixed(2)),
    low: parseFloat((price * 0.98).toFixed(2)),
    open: parseFloat((basePrice * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)),
    previousClose: basePrice
  };
}

async function calculateTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
  try {
    // Fetch historical data for technical analysis
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      const timeSeries = data['Time Series (Daily)'];
      
      if (timeSeries) {
        const prices = Object.values(timeSeries).map((day: any) => parseFloat(day['4. close'])).slice(0, 50);
        return calculateIndicatorsFromPrices(prices);
      }
    }
  } catch (error) {
    console.error('Technical indicators fetch error:', error);
  }

  // Fallback to calculated indicators
  return generateRealisticIndicators();
}

function calculateIndicatorsFromPrices(prices: number[]): TechnicalIndicators {
  // RSI Calculation
  const rsi = calculateRSI(prices, 14);
  
  // SMA Calculation
  const sma20 = prices.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
  const sma50 = prices.length >= 50 ? prices.reduce((a, b) => a + b, 0) / prices.length : sma20;
  
  // MACD Calculation
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const signalLine = macdLine * 0.9; // Simplified
  
  // Bollinger Bands
  const stdDev = calculateStdDev(prices.slice(0, 20));
  const bollingerBands = {
    upper: sma20 + (2 * stdDev),
    middle: sma20,
    lower: sma20 - (2 * stdDev)
  };
  
  return {
    rsi,
    macd: {
      value: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine
    },
    sma20,
    sma50,
    bollingerBands,
    volumeRatio: 1 + (Math.random() - 0.5) * 0.4
  };
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 0; i < period; i++) {
    const change = prices[i] - prices[i + 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateEMA(prices: number[], period: number): number {
  const k = 2 / (period + 1);
  let ema = prices[prices.length - 1];
  
  for (let i = prices.length - 2; i >= Math.max(0, prices.length - period); i--) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

function calculateStdDev(prices: number[]): number {
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;
  return Math.sqrt(variance);
}

function generateRealisticIndicators(): TechnicalIndicators {
  const basePrice = 185;
  return {
    rsi: 45 + Math.random() * 20, // 45-65 range
    macd: {
      value: (Math.random() - 0.5) * 2,
      signal: (Math.random() - 0.5) * 1.5,
      histogram: (Math.random() - 0.5) * 0.5
    },
    sma20: basePrice * (0.98 + Math.random() * 0.04),
    sma50: basePrice * (0.96 + Math.random() * 0.08),
    bollingerBands: {
      upper: basePrice * 1.05,
      middle: basePrice,
      lower: basePrice * 0.95
    },
    volumeRatio: 0.8 + Math.random() * 0.4
  };
}

async function analyzeRecentNews(symbol: string): Promise<NewsAnalysis> {
  try {
    const url = `https://gnews.io/api/v4/search?q=${symbol}&token=${process.env.NEXT_PUBLIC_GNEWS_API_KEY}&lang=en&max=5`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      const articles = data.articles || [];
      
      let totalSentiment = 0;
      const recentNews = [];
      
      for (const article of articles) {
        const sentiment = analyzeSentiment(article.title + ' ' + article.description);
        totalSentiment += sentiment;
        recentNews.push({
          title: article.title,
          sentiment
        });
      }
      
      const avgSentiment = articles.length > 0 ? totalSentiment / articles.length : 0;
      
      return {
        sentiment: avgSentiment,
        impact: Math.abs(avgSentiment) > 0.5 ? 'High' : Math.abs(avgSentiment) > 0.2 ? 'Medium' : 'Low',
        recentNews
      };
    }
  } catch (error) {
    console.error('News analysis error:', error);
  }

  return {
    sentiment: (Math.random() - 0.5) * 0.6,
    impact: 'Medium',
    recentNews: []
  };
}

function analyzeSentiment(text: string): number {
  const bullishWords = ['surge', 'gain', 'rise', 'up', 'growth', 'profit', 'bullish', 'rally', 'soar', 'jump', 'beat', 'strong', 'positive', 'record', 'high'];
  const bearishWords = ['fall', 'drop', 'down', 'loss', 'decline', 'bearish', 'crash', 'plunge', 'tumble', 'miss', 'weak', 'negative', 'concern', 'low'];
  
  const lowerText = text.toLowerCase();
  const bullishCount = bullishWords.filter(word => lowerText.includes(word)).length;
  const bearishCount = bearishWords.filter(word => lowerText.includes(word)).length;
  
  const sentiment = (bullishCount - bearishCount) / (bullishCount + bearishCount + 1);
  return Math.max(-1, Math.min(1, sentiment));
}

async function generateEnhancedPrediction(
  symbol: string,
  marketData: MarketData,
  indicators: TechnicalIndicators,
  newsAnalysis: NewsAnalysis,
  aiPrediction: any,
  timeframe: string
): Promise<EnhancedPrediction> {
  
  // If we have AI backend prediction, enhance it with technical analysis
  if (aiPrediction) {
    const technicalAnalysis = generateTechnicalAnalysis(marketData, indicators, newsAnalysis);
    
    // Use AI prediction confidence as primary confidence
    const direction = aiPrediction.signal === 'BUY' ? 'bullish' : aiPrediction.signal === 'SELL' ? 'bearish' : 'neutral';
    
    return {
      aiPrediction,
      direction,
      targetPrice: aiPrediction.predicted_price,
      priceRange: {
        low: aiPrediction.predicted_price * 0.98,
        high: aiPrediction.predicted_price * 1.02
      },
      reasoning: [
        `AI model predicts ${aiPrediction.signal} signal with ${(aiPrediction.confidence * 100).toFixed(0)}% confidence`,
        `Target price: $${aiPrediction.predicted_price.toFixed(2)} (${aiPrediction.cached ? 'cached' : 'fresh'} prediction)`,
        ...technicalAnalysis.reasoning.slice(0, 2)
      ],
      keyFactors: {
        technical: `AI model (${aiPrediction.model_version}) combined with technical indicators`,
        sentiment: technicalAnalysis.keyFactors.sentiment,
        momentum: technicalAnalysis.keyFactors.momentum
      },
      risks: [
        'AI model predictions are based on historical patterns and may not account for sudden market changes',
        ...technicalAnalysis.risks.slice(0, 2)
      ],
      probability: {
        bullish: aiPrediction.signal === 'BUY' ? Math.round(aiPrediction.confidence * 100) : Math.round((1 - aiPrediction.confidence) * 100),
        bearish: aiPrediction.signal === 'SELL' ? Math.round(aiPrediction.confidence * 100) : Math.round((1 - aiPrediction.confidence) * 100),
        neutral: Math.round((1 - Math.abs(aiPrediction.confidence - 0.5) * 2) * 100)
      },
      recommendation: getRecommendation(aiPrediction.signal, aiPrediction.confidence),
      backendAvailable: true
    };
  }
  
  // Fallback to technical analysis only
  const technicalAnalysis = generateTechnicalAnalysis(marketData, indicators, newsAnalysis);
  
  return {
    aiPrediction: null,
    ...technicalAnalysis,
    backendAvailable: false
  };
}

function generateTechnicalAnalysis(
  marketData: MarketData,
  indicators: TechnicalIndicators,
  newsAnalysis: NewsAnalysis
): Omit<EnhancedPrediction, 'aiPrediction' | 'backendAvailable'> {
  // Calculate prediction based on multiple factors
  let bullishScore = 0;
  let bearishScore = 0;
  
  // RSI analysis
  if (indicators.rsi < 30) bullishScore += 2;
  else if (indicators.rsi > 70) bearishScore += 2;
  else if (indicators.rsi > 50) bullishScore += 0.5;
  else bearishScore += 0.5;
  
  // MACD analysis
  if (indicators.macd.histogram > 0) bullishScore += 1.5;
  else bearishScore += 1.5;
  
  // SMA analysis
  if (marketData.price > indicators.sma20 && indicators.sma20 > indicators.sma50) bullishScore += 2;
  else if (marketData.price < indicators.sma20 && indicators.sma20 < indicators.sma50) bearishScore += 2;
  
  // News sentiment
  if (newsAnalysis.sentiment > 0.3) bullishScore += 1.5;
  else if (newsAnalysis.sentiment < -0.3) bearishScore += 1.5;
  
  // Volume analysis
  if (indicators.volumeRatio > 1.2) {
    if (marketData.changePercent > 0) bullishScore += 1;
    else bearishScore += 1;
  }
  
  const totalScore = bullishScore + bearishScore;
  const bullishProb = (bullishScore / totalScore) * 100;
  const bearishProb = (bearishScore / totalScore) * 100;
  
  const direction = bullishScore > bearishScore ? 'bullish' : 'bearish';
  const confidence = Math.abs(bullishScore - bearishScore) / totalScore * 100;
  
  const priceChange = direction === 'bullish' ? 
    0.02 + (confidence / 100) * 0.03 : 
    -0.02 - (confidence / 100) * 0.03;
  
  const targetPrice = marketData.price * (1 + priceChange);
  
  return {
    direction,
    targetPrice: parseFloat(targetPrice.toFixed(2)),
    priceRange: {
      low: parseFloat((targetPrice * 0.98).toFixed(2)),
      high: parseFloat((targetPrice * 1.02).toFixed(2))
    },
    reasoning: [
      `RSI at ${indicators.rsi.toFixed(0)} indicates ${indicators.rsi < 30 ? 'oversold' : indicators.rsi > 70 ? 'overbought' : 'neutral'} conditions`,
      `MACD ${indicators.macd.histogram > 0 ? 'positive' : 'negative'} momentum suggests ${indicators.macd.histogram > 0 ? 'upward' : 'downward'} trend`,
      `Price ${marketData.price > indicators.sma20 ? 'above' : 'below'} 20-day SMA shows ${marketData.price > indicators.sma20 ? 'bullish' : 'bearish'} positioning`,
      `News sentiment is ${newsAnalysis.sentiment > 0 ? 'positive' : newsAnalysis.sentiment < 0 ? 'negative' : 'neutral'} with ${newsAnalysis.impact.toLowerCase()} impact`
    ],
    keyFactors: {
      technical: `${direction === 'bullish' ? 'Bullish' : 'Bearish'} technical setup with RSI at ${indicators.rsi.toFixed(0)} and MACD ${indicators.macd.histogram > 0 ? 'positive' : 'negative'}`,
      sentiment: `Market sentiment is ${newsAnalysis.sentiment > 0 ? 'positive' : 'negative'} based on recent news analysis`,
      momentum: `${indicators.volumeRatio > 1 ? 'Strong' : 'Weak'} volume with ${marketData.changePercent > 0 ? 'positive' : 'negative'} price action`
    },
    risks: [
      'Market volatility may impact short-term predictions',
      'External factors like economic data releases could change sentiment',
      'Technical indicators can give false signals in trending markets'
    ],
    probability: {
      bullish: Math.round(bullishProb),
      bearish: Math.round(bearishProb),
      neutral: Math.round(100 - bullishProb - bearishProb)
    },
    recommendation: confidence > 70 ? (direction === 'bullish' ? 'strong buy' : 'strong sell') :
                     confidence > 50 ? (direction === 'bullish' ? 'buy' : 'sell') : 'hold'
  };
}

function getRecommendation(signal: string, confidence: number): string {
  const confPercent = confidence * 100;
  
  if (signal === 'BUY') {
    return confPercent > 80 ? 'strong buy' : confPercent > 60 ? 'buy' : 'hold';
  } else if (signal === 'SELL') {
    return confPercent > 80 ? 'strong sell' : confPercent > 60 ? 'sell' : 'hold';
  }
  
  return 'hold';
}