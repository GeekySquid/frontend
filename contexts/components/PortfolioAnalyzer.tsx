'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, PieChart, AlertCircle, Loader2, Plus, X } from 'lucide-react';

interface StockAnalysis {
  current_price: number;
  avg_return: number;
  volatility: number;
  optimal_weight: number;
  recommended_allocation: number;
}

interface PortfolioResult {
  portfolio_optimization: {
    optimal_weights: Record<string, number>;
    expected_annual_return: number;
    annual_volatility: number;
    sharpe_ratio: number;
  };
  stock_analysis: Record<string, StockAnalysis>;
  investment_projections: {
    initial_investment: number;
    projected_1year: number;
    projected_3year: number;
    projected_5year: number;
    gain_1year: number;
    gain_3year: number;
    gain_5year: number;
  };
  risk_assessment: {
    risk_level: string;
    diversification_score: number;
  };
  recommendations: string[];
}

export default function PortfolioAnalyzer() {
  const [tickers, setTickers] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL', 'AMZN']);
  const [newTicker, setNewTicker] = useState('');
  const [investment, setInvestment] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addTicker = () => {
    const ticker = newTicker.trim().toUpperCase();
    if (ticker && !tickers.includes(ticker)) {
      setTickers([...tickers, ticker]);
      setNewTicker('');
    }
  };

  const removeTicker = (ticker: string) => {
    setTickers(tickers.filter(t => t !== ticker));
  };

  const analyzePortfolio = async () => {
    if (tickers.length === 0) {
      setError('Please add at least one stock ticker');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/portfolio-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickers,
          investment,
          action: 'predict'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze portfolio');
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'High': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="bg-[#131824] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <PieChart className="w-5 h-5" />
            Portfolio Analyzer
          </CardTitle>
          <CardDescription className="text-gray-400">
            Optimize your portfolio allocation using AI-powered analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ticker Input */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-300">Stock Tickers</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addTicker()}
                placeholder="Enter ticker (e.g., AAPL)"
                className="flex-1 px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
              />
              <Button onClick={addTicker} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tickers.map(ticker => (
                <Badge key={ticker} variant="secondary" className="px-3 py-1 bg-blue-600/20 text-blue-400 border-blue-600/30">
                  {ticker}
                  <button
                    onClick={() => removeTicker(ticker)}
                    className="ml-2 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Investment Amount */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-300">Investment Amount ($)</label>
            <input
              type="number"
              value={investment}
              onChange={(e) => setInvestment(Number(e.target.value))}
              min="100"
              step="100"
              className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>

          <Button
            onClick={analyzePortfolio}
            disabled={loading || tickers.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Portfolio...
              </>
            ) : (
              'Analyze Portfolio'
            )}
          </Button>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <>
          {/* Portfolio Performance */}
          <Card className="bg-[#131824] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Expected Return</div>
                  <div className="text-2xl font-bold text-green-400">
                    {result.portfolio_optimization.expected_annual_return}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Volatility</div>
                  <div className="text-2xl font-bold text-white">
                    {result.portfolio_optimization.annual_volatility}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Sharpe Ratio</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {result.portfolio_optimization.sharpe_ratio}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Risk Level</div>
                  <Badge className={getRiskColor(result.risk_assessment.risk_level)}>
                    {result.risk_assessment.risk_level}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimal Allocation */}
          <Card className="bg-[#131824] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Optimal Allocation</CardTitle>
              <CardDescription className="text-gray-400">Recommended portfolio weights for maximum Sharpe ratio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(result.stock_analysis).map(([ticker, analysis]) => (
                  <div key={ticker} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white">{ticker}</span>
                      <span className="text-sm text-gray-400">
                        ${analysis.recommended_allocation.toLocaleString()} ({(analysis.optimal_weight * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${analysis.optimal_weight * 100}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>Price: ${analysis.current_price}</span>
                      <span>Return: {analysis.avg_return}%</span>
                      <span>Volatility: {analysis.volatility}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Projections */}
          <Card className="bg-[#131824] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Investment Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">1 Year</div>
                  <div className="text-2xl font-bold text-white">
                    ${result.investment_projections.projected_1year.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-green-400 mt-1">
                    <TrendingUp className="w-4 h-4" />
                    +${result.investment_projections.gain_1year.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-green-900/20 border border-green-800/30 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">3 Years</div>
                  <div className="text-2xl font-bold text-white">
                    ${result.investment_projections.projected_3year.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-green-400 mt-1">
                    <TrendingUp className="w-4 h-4" />
                    +${result.investment_projections.gain_3year.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-purple-900/20 border border-purple-800/30 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">5 Years</div>
                  <div className="text-2xl font-bold text-white">
                    ${result.investment_projections.projected_5year.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-green-400 mt-1">
                    <TrendingUp className="w-4 h-4" />
                    +${result.investment_projections.gain_5year.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="bg-[#131824] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
