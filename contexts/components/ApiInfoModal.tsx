'use client';

import { useState } from 'react';
import { Info, X, ExternalLink } from 'lucide-react';

export default function ApiInfoModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-blue-400 transition-colors"
        title="Data source information"
      >
        <Info className="w-3 h-3" />
        API Info
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#131824] border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4 z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Data Sources</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-green-400 mb-2">✅ Live Data Sources</h4>
                <div className="space-y-2 text-gray-300">
                  <div>
                    <strong>Apify Yahoo Finance:</strong> Primary source for real-time stock data via Yahoo Finance scraping.
                  </div>
                  <div>
                    <strong>Alpha Vantage API:</strong> Backup source with intelligent rate limiting (5 requests/minute).
                  </div>
                  <div>
                    <strong>Steady API:</strong> Additional fallback for live market data.
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-400 mb-2">🚀 Apify Integration</h4>
                <div className="text-gray-300 space-y-1">
                  <div>• High-performance Yahoo Finance scraping</div>
                  <div>• Batch processing for multiple stocks</div>
                  <div>• Real-time quotes and market data</div>
                  <div>• Reliable data extraction</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-yellow-400 mb-2">⚠️ Demo Mode</h4>
                <div className="text-gray-300">
                  When API limits are reached, we use enhanced simulation with realistic market movements and variations.
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-400 mb-2">🔄 Update Frequency</h4>
                <div className="text-gray-300 space-y-1">
                  <div>• Stock Data: Every 30 seconds</div>
                  <div>• Watchlist: Every 2 minutes</div>
                  <div>• Market Indices: Every 1 minute</div>
                  <div>• News Feed: Every 5 minutes</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-purple-400 mb-2">📊 TradingView Charts</h4>
                <div className="text-gray-300">
                  Professional charts with real-time data, technical indicators, and interactive features powered by TradingView.
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>For unlimited real-time data, upgrade to</span>
                  <a 
                    href="https://www.alphavantage.co/premium/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    Alpha Vantage Premium
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}