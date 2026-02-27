'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Award, Target, Brain, ChevronRight } from 'lucide-react';

const patterns = [
  {
    id: 1,
    name: 'Bullish Engulfing',
    description: 'A two-candle pattern where a large bullish candle completely engulfs the previous bearish candle',
    hint: 'Look for a small red candle followed by a larger green candle that covers it entirely',
    difficulty: 'Easy',
    xp: 50,
    data: [
      { open: 180, high: 185, low: 178, close: 179, volume: 45 },
      { open: 179, high: 192, low: 177, close: 190, volume: 78 },
    ]
  },
  {
    id: 2,
    name: 'Hammer',
    description: 'A single candle with a small body at the top and a long lower shadow, indicating potential reversal',
    hint: 'The lower shadow should be at least twice the length of the body',
    difficulty: 'Medium',
    xp: 75,
    data: [
      { open: 185, high: 186, low: 170, close: 184, volume: 92 },
    ]
  },
  {
    id: 3,
    name: 'Morning Star',
    description: 'A three-candle pattern signaling bullish reversal: bearish candle, small-bodied candle, then bullish candle',
    hint: 'The middle candle shows indecision, followed by strong buying pressure',
    difficulty: 'Hard',
    xp: 100,
    data: [
      { open: 195, high: 198, low: 185, close: 187, volume: 65 },
      { open: 186, high: 189, low: 184, close: 188, volume: 42 },
      { open: 189, high: 202, low: 188, close: 200, volume: 88 },
    ]
  }
];

export default function CandlestickQuiz() {
  const [currentPattern, setCurrentPattern] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(12);
  const [lives, setLives] = useState(3);
  const [xp, setXp] = useState(2840);
  const [level, setLevel] = useState(7);
  const [showHint, setShowHint] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const pattern = patterns[currentPattern];
  const options = ['Bullish Engulfing', 'Hammer', 'Morning Star', 'Doji', 'Shooting Star'];

  const handleAnswer = (answer: string) => {
    if (answered) return;
    
    setSelectedAnswer(answer);
    setAnswered(true);

    if (answer === pattern.name) {
      setScore(score + 1);
      setXp(xp + pattern.xp);
      setStreak(streak + 1);
    } else {
      setLives(lives - 1);
      setStreak(0);
    }

    setTimeout(() => {
      if (currentPattern < patterns.length - 1) {
        setCurrentPattern(currentPattern + 1);
      } else {
        setCurrentPattern(0);
      }
      setAnswered(false);
      setSelectedAnswer(null);
      setShowHint(false);
    }, 2000);
  };

  return (
    <div className="h-full bg-[#0a0e1a] text-white p-6 overflow-y-auto">
      {/* Header Stats */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Pattern Master Quiz
            </h1>
            <p className="text-gray-400 mt-1">Sharpen your technical analysis skills</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-400" />
                <div>
                  <div className="text-xs text-gray-400">Streak</div>
                  <div className="text-xl font-bold text-orange-400">{streak} days</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-xs text-gray-400">Lives</div>
                  <div className="text-xl font-bold text-green-400">{lives}/3</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium">Level {level}</span>
            </div>
            <span className="text-sm text-gray-400">{xp} / 3000 XP</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(xp / 3000) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Quiz Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Display */}
          <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Identify the Pattern</h2>
                <p className="text-sm text-gray-400 mt-1">Question {currentPattern + 1} of {patterns.length}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                pattern.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                pattern.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {pattern.difficulty} • +{pattern.xp} XP
              </div>
            </div>

            {/* Candlestick Chart */}
            <div className="bg-[#0a0e1a] rounded-lg p-6 mb-4">
              <div className="flex items-end justify-center gap-4 h-64">
                {pattern.data.map((candle, idx) => {
                  const isGreen = candle.close > candle.open;
                  const bodyHeight = Math.abs(candle.close - candle.open) * 2;
                  const wickTop = (candle.high - Math.max(candle.open, candle.close)) * 2;
                  const wickBottom = (Math.min(candle.open, candle.close) - candle.low) * 2;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center" style={{ height: '100%' }}>
                      <div className="flex-1" />
                      {/* Upper Wick */}
                      <div 
                        className={`w-0.5 ${isGreen ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ height: `${wickTop}px` }}
                      />
                      {/* Body */}
                      <div 
                        className={`w-12 ${isGreen ? 'bg-green-500' : 'bg-red-500'} border-2 ${isGreen ? 'border-green-400' : 'border-red-400'}`}
                        style={{ height: `${bodyHeight}px` }}
                      />
                      {/* Lower Wick */}
                      <div 
                        className={`w-0.5 ${isGreen ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ height: `${wickBottom}px` }}
                      />
                      {/* Volume Bar */}
                      <div className="mt-2 w-12 bg-blue-500/30" style={{ height: `${candle.volume / 2}px` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-8 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span>Bullish</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span>Bearish</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500/30 rounded" />
                  <span>Volume</span>
                </div>
              </div>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 gap-3">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={answered}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    answered && option === pattern.name
                      ? 'bg-green-500/20 border-green-500 text-green-400'
                      : answered && option === selectedAnswer
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-[#0a0e1a] border-gray-700 hover:border-blue-500 hover:bg-blue-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {answered && option === pattern.name && (
                      <span className="text-green-400">✓ Correct</span>
                    )}
                    {answered && option === selectedAnswer && option !== pattern.name && (
                      <span className="text-red-400">✗ Wrong</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Hint Button */}
            <button
              onClick={() => setShowHint(!showHint)}
              className="mt-4 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Brain className="w-4 h-4" />
              {showHint ? 'Hide Hint' : 'Need a Hint? (-10 XP)'}
            </button>

            {showHint && (
              <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">{pattern.hint}</p>
              </div>
            )}
          </div>

          {/* Educational Context */}
          {answered && (
            <div className="bg-[#131824] border border-gray-800 rounded-lg p-6 animate-fade-in">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Pattern Breakdown: {pattern.name}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">{pattern.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Coach Alpha */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Coach Alpha</h3>
                <p className="text-xs text-gray-400">AI Mentor</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {answered && selectedAnswer === pattern.name
                ? "Excellent work! You're mastering these patterns. Keep this momentum going!"
                : "Focus on the candle bodies and their relationship. The story is in the price action."}
            </p>
          </div>

          {/* Achievements */}
          <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Recent Achievements
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Trend Spotter', desc: '10 correct patterns', progress: 80 },
                { name: 'Quick Learner', desc: '5-day streak', progress: 100 },
                { name: 'Pattern Pro', desc: 'Master all patterns', progress: 45 },
              ].map((achievement, idx) => (
                <div key={idx} className="p-3 bg-[#0a0e1a] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{achievement.name}</span>
                    <span className="text-xs text-gray-400">{achievement.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-1.5 rounded-full"
                      style={{ width: `${achievement.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{achievement.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
            <h3 className="font-bold mb-4">Top Performers</h3>
            <div className="space-y-3">
              {[
                { name: 'TraderPro', score: 2450, rank: 1 },
                { name: 'ChartMaster', score: 2380, rank: 2 },
                { name: 'You', score: xp, rank: 7, highlight: true },
              ].map((player) => (
                <div 
                  key={player.rank}
                  className={`flex items-center justify-between p-2 rounded ${
                    player.highlight ? 'bg-blue-500/20 border border-blue-500/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${
                      player.rank === 1 ? 'text-yellow-400' :
                      player.rank === 2 ? 'text-gray-400' :
                      player.rank === 3 ? 'text-orange-400' :
                      'text-gray-500'
                    }`}>
                      #{player.rank}
                    </span>
                    <span className="text-sm">{player.name}</span>
                  </div>
                  <span className="text-sm text-gray-400">{player.score} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
