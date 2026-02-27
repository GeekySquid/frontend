'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Zap, Target } from 'lucide-react';

interface AIAnalysis {
  sentiment: number;
  sentimentLabel: string;
  impact: string;
  insights: string[];
  affectedTickers: string[];
  riskLevel: string;
  confidence: number;
  timestamp: string;
  source: string;
}

interface AINewsAnalysisProps {
  title: string;
  description?: string;
  source?: string;
}

export default function AINewsAnalysis({ title, description, source }: AINewsAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (title) {
      analyzeNews();
    }
  }, [title, description]);

  const analyzeNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, source })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze news');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError('AI analysis unavailable');
      console.error('AI analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold">AI Analysis</h4>
            <p className="text-sm text-gray-400">Analyzing market impact...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold">AI Analysis</h4>
            <p className="text-sm text-gray-400">{error || 'Analysis unavailable'}</p>
          </div>
        </div>
      </div>
    );
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.5) return 'text-green-400';
    if (sentiment > 0) return 'text-green-300';
    if (sentiment > -0.5) return 'text-red-300';
    return 'text-red-400';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0) return <TrendingUp className="w-5 h-5" />;
    if (sentiment < 0) return <TrendingDown className="w-5 h-5" />;
    return <Target className="w-5 h-5" />;
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Brain className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-bold text-lg">AI Market Analysis</h4>
            {analysis.source === 'gemini-ai' && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                Powered by Gemini
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            Advanced sentiment analysis and market impact assessment
          </p>
        </div>
      </div>

      {/* Analysis Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#131824] border border-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            {getSentimentIcon(analysis.sentiment)}
            <span className="text-xs text-gray-400">Sentiment</span>
          </div>
          <div className={`font-bold ${getSentimentColor(analysis.sentiment)}`}>
            {analysis.sentimentLabel}
          </div>
          <div className="text-xs text-gray-500">
            {(analysis.sentiment * 100).toFixed(0)}% score
          </div>
        </div>

        <div className="bg-[#131824] border border-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">Impact</span>
          </div>
          <div className={`font-bold ${
            analysis.impact === 'High' ? 'text-red-400' :
            analysis.impact === 'Medium' ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {analysis.impact}
          </div>
          <div className="text-xs text-gray-500">Market effect</div>
        </div>

        <div className="bg-[#131824] border border-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-400">Risk</span>
          </div>
          <div className={`font-bold text-sm px-2 py-1 rounded border ${getRiskColor(analysis.riskLevel)}`}>
            {analysis.riskLevel}
          </div>
        </div>

        <div className="bg-[#131824] border border-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Confidence</span>
          </div>
          <div className="font-bold text-blue-400">
            {analysis.confidence}%
          </div>
          <div className="text-xs text-gray-500">AI certainty</div>
        </div>
      </div>

      {/* Key Insights */}
      {analysis.insights && analysis.insights.length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold mb-3 text-sm">Key Insights</h5>
          <ul className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Affected Tickers */}
      {analysis.affectedTickers && analysis.affectedTickers.length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold mb-2 text-sm">Potentially Affected</h5>
          <div className="flex flex-wrap gap-2">
            {analysis.affectedTickers.map((ticker, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium"
              >
                {ticker}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-500 pt-4 border-t border-gray-800">
        Analysis generated at {new Date(analysis.timestamp).toLocaleTimeString()} • 
        Source: {analysis.source === 'gemini-ai' ? 'Google Gemini AI' : 'Fallback Analysis'}
      </div>
    </div>
  );
}