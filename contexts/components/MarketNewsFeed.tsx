'use client';

import { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  published_at: string;
  source: string;
  image?: string;
  category: string;
}

interface MarketNewsFeedProps {
  keywords?: string;
  limit?: number;
  showImages?: boolean;
}

export default function MarketNewsFeed({ 
  keywords = 'stock market,finance,trading,economy,nasdaq,dow jones',
  limit = 10,
  showImages = true 
}: MarketNewsFeedProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchNews();
    const interval = setInterval(() => {
      fetchNews();
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [keywords, limit]);

  const fetchNews = async () => {
    try {
      const response = await fetch(`/api/news?keywords=${encodeURIComponent(keywords)}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      setNews(data.data || []);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Unable to load market news');
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getSentimentIcon = (title: string, description: string) => {
    const text = (title + ' ' + description).toLowerCase();
    const bullishWords = ['surge', 'gain', 'rise', 'up', 'growth', 'profit', 'bullish', 'rally'];
    const bearishWords = ['fall', 'drop', 'down', 'loss', 'decline', 'bearish', 'crash'];
    
    const bullishCount = bullishWords.filter(word => text.includes(word)).length;
    const bearishCount = bearishWords.filter(word => text.includes(word)).length;

    if (bullishCount > bearishCount) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (bearishCount > bullishCount) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <AlertCircle className="w-4 h-4 text-gray-500" />;
  };

  if (loading && news.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#131824] dark:bg-[#131824] light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-bold">Market News Feed</h2>
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live
          </div>
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="p-2 hover:bg-gray-800 dark:hover:bg-gray-800 light:hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh news"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Last Update */}
      <div className="text-xs text-gray-500">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>

      {/* News Articles */}
      <div className="space-y-3">
        {news.map((article, index) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="bg-[#131824] dark:bg-[#131824] light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-all">
              <div className="flex gap-4">
                {showImages && article.image && (
                  <img
                    src={article.image}
                    alt=""
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    {getSentimentIcon(article.title, article.description || '')}
                    <h3 className="text-sm font-semibold group-hover:text-blue-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                  {article.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 line-clamp-2 mb-2">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium">{article.source}</span>
                    <span>•</span>
                    <span>{getTimeAgo(article.published_at)}</span>
                    {article.category && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                          {article.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {news.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-8">
          No news articles available at the moment
        </div>
      )}
    </div>
  );
}
