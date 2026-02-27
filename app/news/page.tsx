'use client';

import { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Clock, ExternalLink, AlertTriangle, Zap, Search, RefreshCw } from 'lucide-react';
import TradingChart from '@/components/TradingChart';
import AINewsAnalysis from '@/components/AINewsAnalysis';

interface NewsItem {
  title: string;
  description: string;
  url: string;
  published_at: string;
  source: string;
  image?: string;
  category: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/news?keywords=finance OR stock OR market OR trading OR economy OR nasdaq OR cryptocurrency&limit=20');
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      const articles = data.data || [];
      setNews(articles);
      if (articles.length > 0 && !selectedNews) {
        setSelectedNews(articles[0]);
      }
      setError(null);
    } catch (err) {
      setError('Unable to load news');
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getSentiment = (title: string, description: string) => {
    const text = (title + ' ' + (description || '')).toLowerCase();
    const bullishWords = ['surge', 'gain', 'rise', 'up', 'growth', 'profit', 'bullish', 'rally', 'soar', 'jump', 'climb'];
    const bearishWords = ['fall', 'drop', 'down', 'loss', 'decline', 'bearish', 'crash', 'plunge', 'tumble', 'sink'];
    
    const bullishCount = bullishWords.filter(word => text.includes(word)).length;
    const bearishCount = bearishWords.filter(word => text.includes(word)).length;

    if (bullishCount > bearishCount) return { score: 0.7, label: 'Bullish', color: 'text-green-400' };
    if (bearishCount > bullishCount) return { score: -0.6, label: 'Bearish', color: 'text-red-400' };
    return { score: 0, label: 'Neutral', color: 'text-gray-400' };
  };

  const getImpact = (title: string) => {
    const highImpactWords = ['fed', 'federal reserve', 'interest rate', 'earnings', 'revenue', 'profit'];
    const text = title.toLowerCase();
    const hasHighImpact = highImpactWords.some(word => text.includes(word));
    return hasHighImpact ? 'High' : 'Medium';
  };

  return (
    <div className="h-full bg-[#0a0e1a] text-white overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                News Intelligence
                {loading && <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />}
              </h1>
              <p className="text-sm text-gray-400">Real-time market news powered by Mediastack API</p>
            </div>
            
            <button
              onClick={fetchNews}
              disabled={loading}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-[#131824] border border-gray-800 rounded-lg px-4 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news by headline, description, or source..."
              className="flex-1 bg-transparent border-none outline-none text-sm"
            />
          </div>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* News List */}
          <div className="w-96 border-r border-gray-800 overflow-y-auto">
            {loading && news.length === 0 ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {filteredNews.map((item, index) => {
                  const sentiment = getSentiment(item.title, item.description || '');
                  const impact = getImpact(item.title);
                  
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedNews(item)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedNews?.url === item.url
                          ? 'bg-blue-500/10 border-l-2 border-blue-500'
                          : 'hover:bg-gray-800/50'
                      }`}
                    >
                      {/* News Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            impact === 'High' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {impact}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            sentiment.score > 0 ? 'bg-green-500/20 text-green-400' :
                            sentiment.score < 0 ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {sentiment.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(item.published_at)}
                        </span>
                      </div>

                      {/* Headline */}
                      <h3 className="text-sm font-bold mb-2 leading-tight line-clamp-2">
                        {item.title}
                      </h3>

                      {/* Summary */}
                      {item.description && (
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Newspaper className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">{item.source}</span>
                        </div>
                        {sentiment.score !== 0 && (
                          <div className="flex items-center gap-2">
                            {sentiment.score > 0 ? (
                              <TrendingUp className={`w-4 h-4 ${sentiment.color}`} />
                            ) : (
                              <TrendingDown className={`w-4 h-4 ${sentiment.color}`} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* News Detail & Chart */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedNews ? (
              <>
                {/* News Detail */}
                <div className="flex-shrink-0 border-b border-gray-800 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        {selectedNews.category && (
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-bold">
                            {selectedNews.category}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          getImpact(selectedNews.title) === 'High' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {getImpact(selectedNews.title)} Impact
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                          getSentiment(selectedNews.title, selectedNews.description || '').score > 0
                            ? 'bg-green-500/20 border-green-500/30 text-green-400'
                            : getSentiment(selectedNews.title, selectedNews.description || '').score < 0
                            ? 'bg-red-500/20 border-red-500/30 text-red-400'
                            : 'bg-gray-500/20 border-gray-500/30 text-gray-400'
                        }`}>
                          {getSentiment(selectedNews.title, selectedNews.description || '').label}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">{selectedNews.title}</h2>
                      {selectedNews.description && (
                        <p className="text-gray-300 leading-relaxed mb-4">{selectedNews.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Newspaper className="w-4 h-4" />
                          {selectedNews.source}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getTimeAgo(selectedNews.published_at)}
                        </span>
                        <a
                          href={selectedNews.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Read Full Article
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Article Image */}
                  {selectedNews.image && (
                    <div className="mb-4">
                      <img
                        src={selectedNews.image}
                        alt={selectedNews.title}
                        className="w-full h-64 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Sentiment Analysis */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Sentiment Score</div>
                      <div className={`text-2xl font-bold ${getSentiment(selectedNews.title, selectedNews.description || '').color}`}>
                        {getSentiment(selectedNews.title, selectedNews.description || '').label}
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${
                            getSentiment(selectedNews.title, selectedNews.description || '').score > 0 
                              ? 'bg-green-500' 
                              : getSentiment(selectedNews.title, selectedNews.description || '').score < 0
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                          }`}
                          style={{ width: `${Math.abs(getSentiment(selectedNews.title, selectedNews.description || '').score) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Source</div>
                      <div className="text-lg font-bold text-blue-400 truncate">
                        {selectedNews.source}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">News provider</div>
                    </div>

                    <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Market Impact</div>
                      <div className="text-2xl font-bold text-yellow-400">{getImpact(selectedNews.title)}</div>
                      <div className="text-xs text-gray-500 mt-1">Estimated severity</div>
                    </div>
                  </div>
                </div>

                {/* Chart with News Overlay */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <h3 className="font-bold">Market Overview</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      Real-time market data visualization
                    </p>
                  </div>
                  <TradingChart 
                    symbol="NVDA"
                    price={185.33}
                    change={-5.23}
                  />

                  {/* AI Analysis */}
                  <AINewsAnalysis 
                    title={selectedNews.title}
                    description={selectedNews.description}
                    source={selectedNews.source}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a news article to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
