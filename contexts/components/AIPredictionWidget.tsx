'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Loader2, RefreshCw, Server, Zap } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface AIPredictionWidgetProps {
  symbol: string;
}

export default function AIPredictionWidget({ symbol }: AIPredictionWidgetProps) {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<any>(null);

  useEffect(() => {
    fetchPrediction();
  }, [symbol]);

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stock-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe: '24h' })
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction(data.prediction);
        setBackendStatus(data.backendStatus);
      }
    } catch (error) {
      console.error('Failed to fetch prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">AI 24h Prediction</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400">
                {prediction?.backendAvailable ? 'AI Backend + Technical' : 'Technical Analysis'}
              </p>
              {backendStatus && (
                <Badge 
                  variant={backendStatus.available ? 'default' : 'destructive'}
                  className="text-xs px-1 py-0 h-4"
                >
                  {backendStatus.available ? (
                    <div className="flex items-center gap-1">
                      <Server className="w-2 h-2" />
                      {backendStatus.latency}ms
                    </div>
                  ) : (
                    'Offline'
                  )}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={fetchPrediction}
          className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0a0e1a] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            {prediction.direction === 'bullish' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={`font-bold text-sm ${
              prediction.direction === 'bullish' ? 'text-green-400' : 'text-red-400'
            }`}>
              {prediction.direction === 'bullish' ? 'BULLISH' : 'BEARISH'}
            </span>
          </div>
          <div className="text-xs text-gray-400">Direction</div>
        </div>

        <div className="bg-[#0a0e1a] rounded-lg p-3">
          <div className="text-lg font-bold text-blue-400">{prediction.confidence}%</div>
          <div className="text-xs text-gray-400">Confidence</div>
        </div>
      </div>

      <div className="bg-[#0a0e1a] rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">Target Price</span>
          <div className="flex items-center gap-2">
            <span className="font-bold">${prediction.targetPrice}</span>
            {prediction.aiPrediction && (
              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                <Zap className="w-2 h-2 mr-1" />
                AI: ${prediction.aiPrediction.predicted_price.toFixed(2)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Range</span>
          <span>${prediction.priceRange.low} - ${prediction.priceRange.high}</span>
        </div>
        {prediction.aiPrediction && (
          <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
            <span>AI Signal</span>
            <Badge 
              variant={prediction.aiPrediction.signal === 'BUY' ? 'default' : 
                      prediction.aiPrediction.signal === 'SELL' ? 'destructive' : 'secondary'}
              className="text-xs px-1 py-0 h-4"
            >
              {prediction.aiPrediction.signal}
            </Badge>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Probability</div>
        <div className="flex gap-1 h-6 rounded overflow-hidden">
          <div 
            className="bg-green-500 flex items-center justify-center text-xs font-bold"
            style={{ width: `${prediction.probability.bullish}%` }}
          >
            {prediction.probability.bullish > 15 && `${prediction.probability.bullish}%`}
          </div>
          <div 
            className="bg-gray-500 flex items-center justify-center text-xs font-bold"
            style={{ width: `${prediction.probability.neutral}%` }}
          >
            {prediction.probability.neutral > 15 && `${prediction.probability.neutral}%`}
          </div>
          <div 
            className="bg-red-500 flex items-center justify-center text-xs font-bold"
            style={{ width: `${prediction.probability.bearish}%` }}
          >
            {prediction.probability.bearish > 15 && `${prediction.probability.bearish}%`}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-xs text-gray-400 font-bold">Key Factors:</div>
        <div className="text-xs text-gray-300 space-y-1">
          <div>• {prediction.keyFactors.technical}</div>
          <div>• {prediction.keyFactors.sentiment}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link 
          href="/playground"
          className="flex-1 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors text-xs text-center"
        >
          Test Your Prediction
        </Link>
        <div className={`px-3 py-2 rounded-lg text-xs font-bold text-center ${
          prediction.recommendation.includes('buy') 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : prediction.recommendation.includes('sell')
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }`}>
          {prediction.recommendation.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
