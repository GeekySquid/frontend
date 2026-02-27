'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Brain, Target, Zap, Activity, AlertCircle, CheckCircle, Loader2, BarChart3, Search, X, Clock, Star } from 'lucide-react';

// Popular stocks that are always shown
const popularStocks = [
  { symbol: 'NVDA', name: 'NVIDIA Corp' },
  { symbol: 'AAPL', name: 'Apple Inc' },
  { symbol: 'TSLA', name: 'Tesla Inc' },
  { symbol: 'MSFT', name: 'Microsoft Corp' },
  { symbol: 'GOOGL', name: 'Alphabet Inc' },
  { symbol: 'AMZN', name: 'Amazon.com Inc' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'NFLX', name: 'Netflix Inc' },
];

// Common stock symbols for autocomplete
const commonStocks = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX',
  'AMD', 'INTC', 'QCOM', 'AVGO', 'CSCO', 'ORCL', 'IBM', 'CRM',
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'V', 'MA',
  'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'MRK', 'LLY', 'ABT',
  'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PXD', 'MPC', 'VLO',
  'WMT', 'HD', 'COST', 'TGT', 'LOW', 'TJX', 'SBUX', 'MCD',
  'DIS', 'CMCSA', 'T', 'VZ', 'TMUS', 'CHTR', 'NFLX', 'PARA',
  'BA', 'CAT', 'DE', 'GE', 'HON', 'MMM', 'UPS', 'FDX',
  'COIN', 'SQ', 'PYPL', 'SHOP', 'UBER', 'LYFT', 'ABNB', 'DASH'
];

interface PredictionData {
  direction: 'bullish' | 'bearish';
  confidence: number;
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
  technicalIndicators?: any;
  newsAnalysis?: any;
}

export default function PlaygroundPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; name: string } | null>(null);
  const [userPrediction, setUserPrediction] = useState<'up' | 'down' | null>(null);
  const [aiPrediction, setAiPrediction] = useState<PredictionData | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('24h');
  const [predictionHistory, setPredictionHistory] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Update search suggestions
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = commonStocks.filter(symbol => 
        symbol.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8);
      setSearchSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedStock) {
      fetchAIPrediction();
    }
  }, [selectedStock, timeframe]);

  const handleStockSearch = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    setSelectedStock({ symbol: upperSymbol, name: getStockName(upperSymbol) });
    setSearchQuery('');
    setShowSuggestions(false);
    
    // Add to recent searches
    const updated = [upperSymbol, ...recentSearches.filter(s => s !== upperSymbol)].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const getStockName = (symbol: string): string => {
    const stock = popularStocks.find(s => s.symbol === symbol);
    return stock?.name || `${symbol} Stock`;
  };

  const fetchAIPrediction = async () => {
    if (!selectedStock) return;
    
    setLoading(true);
    setShowResult(false);
    setUserPrediction(null);
    
    try {
      const response = await fetch('/api/stock-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol: selectedStock.symbol,
          timeframe 
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiPrediction(data.prediction);
      }
    } catch (error) {
      console.error('Failed to fetch AI prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = (direction: 'up' | 'down') => {
    if (!selectedStock) return;
    
    setUserPrediction(direction);
    setShowResult(true);
    
    // Save to history
    const newPrediction = {
      symbol: selectedStock.symbol,
      userPrediction: direction,
      aiPrediction: aiPrediction?.direction,
      timestamp: new Date().toISOString(),
      match: direction === (aiPrediction?.direction === 'bullish' ? 'up' : 'down')
    };
    setPredictionHistory(prev => [newPrediction, ...prev].slice(0, 10));
  };

  const winRate = predictionHistory.length > 0 
    ? (predictionHistory.filter(p => p.match).length / predictionHistory.length * 100).toFixed(0)
    : '0';

  return (
    <div className="h-full bg-[#0a0e1a] text-white p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Stock Prediction Playground
          </h1>
          <div className="flex items-center gap-2 bg-[#131824] border border-gray-800 rounded-lg px-4 py-2">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-sm">Real-time AI Analysis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Stock Search */}
            <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Search Any Stock</h2>
              
              {/* Search Input */}
              <div className="relative mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && searchQuery) {
                        handleStockSearch(searchQuery);
                      }
                    }}
                    placeholder="Enter stock symbol (e.g., AAPL, TSLA, NVDA)..."
                    className="w-full pl-10 pr-10 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none text-white placeholder-gray-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setShowSuggestions(false);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Search Suggestions */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-[#131824] border border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {searchSuggestions.map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => handleStockSearch(symbol)}
                        className="w-full px-4 py-3 text-left hover:bg-[#0a0e1a] transition-colors border-b border-gray-800 last:border-b-0"
                      >
                        <div className="font-bold">{symbol}</div>
                        <div className="text-sm text-gray-400">{getStockName(symbol)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Recent Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => handleStockSearch(symbol)}
                        className="px-3 py-1.5 bg-[#0a0e1a] border border-gray-700 rounded-lg hover:border-blue-500 transition-colors text-sm"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Stocks */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-400">Popular Stocks</span>
                  <div className="flex-1 flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-500">Timeframe:</span>
                    <select 
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                      className="bg-[#0a0e1a] border border-gray-700 rounded px-2 py-1 text-xs"
                    >
                      <option value="24h">24 Hours</option>
                      <option value="1w">1 Week</option>
                      <option value="1m">1 Month</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {popularStocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      disabled={loading}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedStock?.symbol === stock.symbol
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-bold text-sm">{stock.symbol}</div>
                      <div className="text-xs text-gray-400 truncate">{stock.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Stock Display */}
              {selectedStock && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Analyzing</div>
                      <div className="text-xl font-bold">{selectedStock.symbol}</div>
                      <div className="text-sm text-gray-400">{selectedStock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Timeframe</div>
                      <div className="text-lg font-bold text-blue-400">{timeframe}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Prediction Display */}
            {!selectedStock ? (
              <div className="bg-[#131824] border border-gray-800 rounded-lg p-12 flex flex-col items-center justify-center">
                <Search className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Search for a Stock</h3>
                <p className="text-gray-400 text-center">
                  Enter any stock symbol above or select from popular stocks to get AI-powered predictions
                </p>
              </div>
            ) : loading ? (
              <div className="bg-[#131824] border border-gray-800 rounded-lg p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                <p className="text-gray-400">Analyzing market data and generating AI prediction...</p>
              </div>
            ) : aiPrediction && (
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">AI Prediction</h3>
                      <p className="text-sm text-gray-400">Based on real-time data & technical analysis</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-bold ${
                    aiPrediction.direction === 'bullish' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {aiPrediction.direction === 'bullish' ? '↑ BULLISH' : '↓ BEARISH'}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#0a0e1a] rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Target Price</div>
                    <div className="text-2xl font-bold">${aiPrediction.targetPrice}</div>
                    <div className="text-xs text-gray-500">
                      Range: ${aiPrediction.priceRange.low} - ${aiPrediction.priceRange.high}
                    </div>
                  </div>
                  <div className="bg-[#0a0e1a] rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Confidence</div>
                    <div className="text-2xl font-bold text-blue-400">{aiPrediction.confidence}%</div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${aiPrediction.confidence}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-[#0a0e1a] rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Recommendation</div>
                    <div className="text-lg font-bold uppercase">{aiPrediction.recommendation}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Key Analysis Factors
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#0a0e1a] rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Technical</div>
                        <div className="text-sm">{aiPrediction.keyFactors.technical}</div>
                      </div>
                      <div className="bg-[#0a0e1a] rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Sentiment</div>
                        <div className="text-sm">{aiPrediction.keyFactors.sentiment}</div>
                      </div>
                      <div className="bg-[#0a0e1a] rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Momentum</div>
                        <div className="text-sm">{aiPrediction.keyFactors.momentum}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold mb-2">Probability Distribution</h4>
                    <div className="flex gap-2 h-8">
                      <div 
                        className="bg-green-500 rounded flex items-center justify-center text-xs font-bold"
                        style={{ width: `${aiPrediction.probability.bullish}%` }}
                      >
                        {aiPrediction.probability.bullish}%
                      </div>
                      <div 
                        className="bg-gray-500 rounded flex items-center justify-center text-xs font-bold"
                        style={{ width: `${aiPrediction.probability.neutral}%` }}
                      >
                        {aiPrediction.probability.neutral}%
                      </div>
                      <div 
                        className="bg-red-500 rounded flex items-center justify-center text-xs font-bold"
                        style={{ width: `${aiPrediction.probability.bearish}%` }}
                      >
                        {aiPrediction.probability.bearish}%
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Bullish</span>
                      <span>Neutral</span>
                      <span>Bearish</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold mb-2">AI Reasoning</h4>
                    <ul className="space-y-2">
                      {aiPrediction.reasoning.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      Risk Factors
                    </h4>
                    <ul className="space-y-2">
                      {aiPrediction.risks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                          <span className="text-yellow-400">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Prediction Interface */}
            {selectedStock && (
              <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Make Your Prediction</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Compare your prediction with AI analysis for {selectedStock.symbol} over the next {timeframe}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => handlePredict('up')}
                  disabled={userPrediction !== null || loading}
                  className="p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 rounded-lg hover:border-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <div className="text-xl font-bold">Bullish</div>
                  <div className="text-sm text-gray-400">Price will go UP</div>
                </button>
                <button
                  onClick={() => handlePredict('down')}
                  disabled={userPrediction !== null || loading}
                  className="p-8 bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/30 rounded-lg hover:border-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingDown className="w-12 h-12 mx-auto mb-3 text-red-400" />
                  <div className="text-xl font-bold">Bearish</div>
                  <div className="text-sm text-gray-400">Price will go DOWN</div>
                </button>
              </div>

              {showResult && aiPrediction && (
                <div className="p-6 bg-[#0a0e1a] rounded-lg border border-gray-700">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Prediction Comparison
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Your Prediction:</span>
                      <span className={`font-bold ${userPrediction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        {userPrediction === 'up' ? '↑ Bullish' : '↓ Bearish'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>AI Prediction:</span>
                      <span className={`font-bold ${aiPrediction.direction === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                        {aiPrediction.direction === 'bullish' ? '↑ Bullish' : '↓ Bearish'}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-gray-700">
                      {userPrediction === (aiPrediction.direction === 'bullish' ? 'up' : 'down') ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-bold">You agree with AI! Great minds think alike.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-bold">Different prediction! AI confidence: {aiPrediction.confidence}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUserPrediction(null);
                      setShowResult(false);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    Make Another Prediction
                  </button>
                </div>
              )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Your Stats
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-[#0a0e1a] rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{winRate}%</div>
                  <p className="text-sm text-gray-400">Win Rate (vs AI)</p>
                </div>
                <div className="p-3 bg-[#0a0e1a] rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{predictionHistory.length}</div>
                  <p className="text-sm text-gray-400">Total Predictions</p>
                </div>
              </div>
            </div>

            {/* Prediction History */}
            {predictionHistory.length > 0 && (
              <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
                <h3 className="font-bold mb-4">Recent Predictions</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {predictionHistory.map((pred, idx) => (
                    <div key={idx} className="p-3 bg-[#0a0e1a] rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{pred.symbol}</span>
                        {pred.match ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>You: {pred.userPrediction === 'up' ? '↑' : '↓'}</span>
                        <span>AI: {pred.aiPrediction === 'bullish' ? '↑' : '↓'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                How It Works
              </h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Real-time market data analysis</li>
                <li>• Technical indicators (RSI, MACD, SMA)</li>
                <li>• News sentiment analysis</li>
                <li>• AI-powered prediction engine</li>
                <li>• Risk assessment & probability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
