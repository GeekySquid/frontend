'use client';

import DynamicStockHeader from '@/components/DynamicStockHeader';
import StockSelector from '@/components/StockSelector';
import DataSourceIndicator from '@/components/DataSourceIndicator';
import ApiInfoModal from '@/components/ApiInfoModal';
import RateLimitStatus from '@/components/RateLimitStatus';
import FinancialChatbot from '@/components/FinancialChatbot';
import Watchlist from '@/components/Watchlist';
import KeyStats from '@/components/KeyStats';
import AnalystRatings from '@/components/AnalystRatings';
import FinancialStats from '@/components/FinancialStats';
import PerformanceChart from '@/components/PerformanceChart';
import CompanyInfo from '@/components/CompanyInfo';
import RealTimeNews from '@/components/RealTimeNews';
import AIPredictionWidget from '@/components/AIPredictionWidget';
import BackendStatus from '@/components/BackendStatus';
import { useStockData } from '@/hooks/useRealTimeData';
import { Brain, BookOpen, Target, TrendingUp, Newspaper, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import TradingView widget to prevent SSR issues
const TradingViewWidget = dynamic(() => import('@/components/TradingViewWidget'), {
  ssr: false,
  loading: () => (
    <div className="bg-[#131824] border border-gray-800 rounded-lg p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading Chart...</p>
      </div>
    </div>
  )
});

// Force dynamic rendering
export const dynamicParams = true;

export default function DashboardPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('NVDA');
  const [dataSourceInfo, setDataSourceInfo] = useState<{source?: string; note?: string}>({});
  const { data: stockData, loading, error, lastUpdated, refresh } = useStockData(selectedSymbol, 30000);

  // Fetch data source info
  useEffect(() => {
    const fetchSourceInfo = async () => {
      try {
        const response = await fetch(`/api/live-data?type=stocks&symbols=${selectedSymbol}`);
        const data = await response.json();
        setDataSourceInfo({
          source: data.source,
          note: data.note
        });
      } catch (err) {
        console.error('Failed to fetch source info:', err);
      }
    };
    
    fetchSourceInfo();
  }, [selectedSymbol]);

  // Fallback data for when API is loading or fails
  const displayData = stockData || {
    symbol: selectedSymbol,
    name: 'NVIDIA Corp',
    price: 185.33,
    change: -5.23,
    changePercent: -2.74,
    volume: 236520000,
    high: 194.27,
    low: 184.56,
    open: 189.45,
    previousClose: 190.56
  };

  return (
    <div className="h-full bg-[#0a0e1a] dark:bg-[#0a0e1a] light:bg-gray-50 text-white dark:text-white light:text-gray-900 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Stock Header */}
        <DynamicStockHeader symbol={selectedSymbol} />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Chart + Analysis */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Data Source Indicator */}
              <DataSourceIndicator 
                source={dataSourceInfo.source}
                note={dataSourceInfo.note}
                lastUpdated={lastUpdated}
                loading={loading}
              />

              {/* Rate Limit Status & Backend Status */}
              <div className="flex gap-4">
                <RateLimitStatus />
                <BackendStatus />
              </div>

              {/* Stock Selector & Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StockSelector 
                    selectedSymbol={selectedSymbol}
                    onSymbolChange={setSelectedSymbol}
                  />
                  <ApiInfoModal />
                </div>
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors text-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Quick Access Cards */}
              <div className="grid grid-cols-4 gap-3">
                <Link href="/learn" className="bg-[#131824] dark:bg-[#131824] light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-lg p-3 hover:border-blue-500 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Learn</span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Progress 54%</div>
                </Link>

                <Link href="/quiz" className="bg-[#131824] dark:bg-[#131824] light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-lg p-3 hover:border-blue-500 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Quiz</span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">12 day streak</div>
                </Link>

                <Link href="/playground" className="bg-[#131824] dark:bg-[#131824] light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-lg p-3 hover:border-blue-500 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Predict</span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Win rate 67%</div>
                </Link>

                <Link href="/news" className="bg-[#131824] dark:bg-[#131824] light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-lg p-3 hover:border-blue-500 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Newspaper className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">News</span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Real-time</div>
                </Link>
              </div>

              {/* Main TradingView Chart */}
              <TradingViewWidget 
                symbol={`NASDAQ:${displayData.symbol}`}
                theme="dark"
                height={500}
                width="100%"
                interval="D"
                allow_symbol_change={true}
                hide_side_toolbar={false}
                studies={['Volume@tv-basicstudies', 'MACD@tv-basicstudies']}
              />

              {/* AI Analysis with Live Context */}
              <AIPredictionWidget symbol={selectedSymbol} />

              {/* Performance & Analyst Ratings */}
              <div className="grid grid-cols-2 gap-4">
                <PerformanceChart />
                <AnalystRatings />
              </div>

              {/* Company Info */}
              <CompanyInfo />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 border-l border-gray-800 dark:border-gray-800 light:border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-4">
              <Watchlist />
              <RealTimeNews />
              <KeyStats />
              <FinancialStats />
            </div>
          </div>
        </div>
      </div>

      {/* Financial AI Chatbot */}
      <FinancialChatbot 
        currentStock={selectedSymbol}
        marketData={displayData}
      />
    </div>
  );
}
// Mock stock data - in a real app, this would come from an API
const stockData = {
  symbol: 'NVDA',
  price: 185.33,
  change: -5.23,
  changePercent: -2.74,
  volume: 236520000
};
