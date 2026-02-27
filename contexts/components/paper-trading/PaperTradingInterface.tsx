'use client';

import { useState } from 'react';
import { TrendingUp, DollarSign, BarChart3, Clock } from 'lucide-react';

interface PaperTradingInterfaceProps {
  userId: string;
}

export default function PaperTradingInterface({ userId }: PaperTradingInterfaceProps) {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');

  return (
    <div className="h-full bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Paper Trading</h1>
            <p className="text-gray-400">Practice trading with virtual money</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-[#131824] border border-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Virtual Balance:</span>
                <span className="font-bold text-green-400">$100,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="grid lg:grid-cols-3 gap-6 h-full">
          {/* Trading Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart Placeholder */}
            <div className="bg-[#131824] border border-gray-800 rounded-lg p-6 h-96">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Chart - {selectedSymbol}</h3>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">TradingView Integration</span>
                </div>
              </div>
              
              <div className="h-full bg-gray-900/50 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <TrendingUp className="w-12 h-12 text-blue-400 mx-auto" />
                  <p className="text-gray-400">Chart will be integrated here</p>
                  <p className="text-sm text-gray-500">Real-time market data with trade markers</p>
                </div>
              </div>
            </div>

            {/* Order Form */}
            <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Place Order</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Symbol</label>
                  <input
                    type="text"
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="AAPL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Quantity</label>
                  <input
                    type="number"
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Order Type</label>
                  <select className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none">
                    <option value="market">Market</option>
                    <option value="limit">Limit</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Side</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-3 bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                      Buy
                    </button>
                    <button className="p-3 bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                      Sell
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Positions */}
            <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Open Positions</h3>
              
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">No open positions</p>
                <p className="text-sm text-gray-500">Place your first trade to get started</p>
              </div>
            </div>

            {/* Session Stats */}
            <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Session Stats</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Trades:</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">P&L:</span>
                  <span className="text-green-400">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate:</span>
                  <span>-</span>
                </div>
              </div>
            </div>

            {/* Learning Tips */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">💡 Trading Tip</h3>
              <p className="text-sm text-gray-300">
                Start with small position sizes to practice risk management. 
                Focus on learning rather than maximizing profits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}