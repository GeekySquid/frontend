'use client';

import { useState } from 'react';
import { Wallet, Mail, Trophy, TrendingUp, Award, Activity, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const handleConnect = () => {
    // Simulate wallet connection
    setIsConnected(true);
    setWalletAddress('0x742d...4a8f');
  };

  return (
    <div className="h-full bg-[#0a0e1a] text-white p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Nexus Trade Identity
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 bg-[#131824] border border-gray-800 rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold">
                  TM
                </div>
                <div>
                  <h2 className="text-2xl font-bold">TraderMaster</h2>
                  <p className="text-gray-400">Member since Jan 2026</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-400">Silver IV</div>
                <p className="text-sm text-gray-400">Rank Tier</p>
              </div>
            </div>

            {/* Wallet Connection */}
            <div className="mb-6 p-4 bg-[#0a0e1a] rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="font-medium">Web3 Wallet</p>
                    <p className="text-sm text-gray-400">
                      {isConnected ? walletAddress : 'Not connected'}
                    </p>
                  </div>
                </div>
                {!isConnected ? (
                  <button
                    onClick={handleConnect}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    Connected
                  </div>
                )}
              </div>
            </div>

            {/* Email Connection */}
            <div className="mb-6 p-4 bg-[#0a0e1a] rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="font-medium">Email Account</p>
                    <p className="text-sm text-gray-400">trader@example.com</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  Verified
                </div>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="font-medium">Experience Points</span>
                </div>
                <span className="text-sm text-gray-400">2,840 / 3,000 XP</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full"
                  style={{ width: '94.6%' }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">160 XP to next rank (Gold I)</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-[#0a0e1a] rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-blue-400">47</div>
                <p className="text-sm text-gray-400">Quizzes Completed</p>
              </div>
              <div className="p-4 bg-[#0a0e1a] rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-green-400">89%</div>
                <p className="text-sm text-gray-400">Accuracy Rate</p>
              </div>
              <div className="p-4 bg-[#0a0e1a] rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-purple-400">12</div>
                <p className="text-sm text-gray-400">Day Streak</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {[
                  { action: 'Completed Quiz', detail: 'Candlestick Patterns', xp: '+50 XP', time: '2h ago' },
                  { action: 'Prediction Win', detail: 'NVDA Bullish', xp: '+75 XP', time: '5h ago' },
                  { action: 'Module Unlocked', detail: 'Options Trading', xp: '+100 XP', time: '1d ago' },
                  { action: 'Achievement', detail: 'Trend Spotter', xp: '+200 XP', time: '2d ago' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-start justify-between p-3 bg-[#0a0e1a] rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-400">{activity.detail}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                    <span className="text-sm text-green-400 font-medium">{activity.xp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Achievements
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🎯', name: 'First Win', unlocked: true },
                  { icon: '🔥', name: '7-Day Streak', unlocked: true },
                  { icon: '📈', name: 'Bull Master', unlocked: true },
                  { icon: '🏆', name: 'Top 10', unlocked: false },
                  { icon: '💎', name: 'Diamond Hands', unlocked: false },
                  { icon: '🚀', name: 'Moon Shot', unlocked: false },
                ].map((badge, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-center ${
                      badge.unlocked
                        ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                        : 'bg-[#0a0e1a] border border-gray-700 opacity-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <p className="text-xs">{badge.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
