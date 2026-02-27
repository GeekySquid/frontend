'use client';

import { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, Award, Clock, Target, Zap, Play, Lock, CheckCircle, Users } from 'lucide-react';
import { learningModules, learningPaths, getRecommendedModules } from '@/lib/learningData';
import { UserProgress, Module } from '@/lib/learningSystem';

interface LearningDashboardProps {
  userProgress?: UserProgress;
  currentMarketCondition?: string;
}

export default function LearningDashboard({ 
  userProgress, 
  currentMarketCondition = 'always-relevant' 
}: LearningDashboardProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [recommendedModules, setRecommendedModules] = useState<string[]>([]);

  useEffect(() => {
    setRecommendedModules(getRecommendedModules(currentMarketCondition));
  }, [currentMarketCondition]);

  const getModuleProgress = (moduleId: string): number => {
    if (!userProgress?.moduleProgress[moduleId]) return 0;
    const progress = userProgress.moduleProgress[moduleId];
    const module = learningModules.find(m => m.id === moduleId);
    if (!module) return 0;
    
    return Math.round((progress.completedLessons.length / module.lessons.length) * 100);
  };

  const isModuleUnlocked = (module: Module): boolean => {
    if (module.prerequisites.length === 0) return true;
    
    return module.prerequisites.every(prereq => {
      const progress = userProgress?.moduleProgress[prereq];
      return progress && progress.completionDate;
    });
  };

  const getTotalXP = (): number => {
    return userProgress?.totalXP || 0;
  };

  const getCurrentLevel = (): number => {
    const xp = getTotalXP();
    return Math.floor(xp / 1000) + 1;
  };

  const getXPToNextLevel = (): number => {
    const currentLevel = getCurrentLevel();
    const currentXP = getTotalXP();
    const nextLevelXP = currentLevel * 1000;
    return nextLevelXP - currentXP;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">Level {getCurrentLevel()}</div>
              <p className="text-xs text-gray-400">{getXPToNextLevel()} XP to next level</p>
            </div>
          </div>
        </div>

        <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {Object.values(userProgress?.moduleProgress || {}).reduce((acc, progress) => 
                  acc + progress.completedLessons.length, 0
                )}
              </div>
              <p className="text-xs text-gray-400">Lessons Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {userProgress?.achievements.length || 0}
              </div>
              <p className="text-xs text-gray-400">Achievements</p>
            </div>
          </div>
        </div>

        <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {userProgress?.learningStreak || 0}
              </div>
              <p className="text-xs text-gray-400">Day Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Market-Adaptive Recommendations */}
      {recommendedModules.length > 0 && (
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">Market-Adaptive Learning</h3>
              <p className="text-sm text-gray-300 mb-4">
                Based on current market conditions ({currentMarketCondition.replace('-', ' ')}), 
                these modules are highly relevant for your learning:
              </p>
              <div className="flex flex-wrap gap-2">
                {recommendedModules.map(moduleId => {
                  const module = learningModules.find(m => m.id === moduleId);
                  if (!module) return null;
                  
                  return (
                    <button
                      key={moduleId}
                      className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-colors text-sm"
                    >
                      {module.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Learning Modules for Hackathon */}
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">🚀 Featured Learning Modules</h3>
            <p className="text-gray-300">Comprehensive financial education system with interactive content</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400">{learningModules.length}</div>
            <p className="text-sm text-gray-400">Total Modules</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              module: learningModules.find(m => m.id === 'fundamentals-101'),
              highlight: 'Perfect for Beginners',
              color: 'from-green-500 to-emerald-500'
            },
            {
              module: learningModules.find(m => m.id === 'technical-analysis-101'),
              highlight: 'Chart Reading Mastery',
              color: 'from-blue-500 to-cyan-500'
            },
            {
              module: learningModules.find(m => m.id === 'crypto-trading-101'),
              highlight: 'Trending: Crypto & DeFi',
              color: 'from-orange-500 to-red-500'
            }
          ].map((item, index) => {
            if (!item.module) return null;
            const progress = getModuleProgress(item.module.id);
            
            return (
              <div key={index} className="bg-[#0a0e1a] border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{item.module.title}</h4>
                    <p className="text-xs text-blue-400">{item.highlight}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>{item.module.lessons.length} lessons</span>
                  <span>{item.module.estimatedHours}h</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3">
                  <div
                    className={`bg-gradient-to-r ${item.color} h-1.5 rounded-full transition-all`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button className="w-full py-2 bg-blue-500/20 border border-blue-500/30 rounded text-xs hover:bg-blue-500/30 transition-colors">
                  {progress === 0 ? 'Start Learning' : 'Continue'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Learning System Features */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6" />
            </div>
            <h5 className="font-medium text-sm">Interactive Quizzes</h5>
            <p className="text-xs text-gray-400">Test your knowledge</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Play className="w-6 h-6" />
            </div>
            <h5 className="font-medium text-sm">Hands-On Exercises</h5>
            <p className="text-xs text-gray-400">Practice with real scenarios</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6" />
            </div>
            <h5 className="font-medium text-sm">Certificates</h5>
            <p className="text-xs text-gray-400">Earn completion badges</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h5 className="font-medium text-sm">Progress Tracking</h5>
            <p className="text-xs text-gray-400">Monitor your growth</p>
          </div>
        </div>
      </div>

      {/* Daily Challenge & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Challenge */}
        <div className="lg:col-span-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold mb-1">🎯 Daily Learning Challenge</h3>
              <p className="text-sm text-gray-300">Complete today's challenge for bonus XP and streak maintenance</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">+150 XP</div>
              <p className="text-xs text-gray-400">Bonus Reward</p>
            </div>
          </div>
          
          <div className="bg-[#0a0e1a] border border-gray-700 rounded-lg p-4 mb-4">
            <h4 className="font-bold mb-2">Today's Challenge: Market Volatility Quiz</h4>
            <p className="text-sm text-gray-400 mb-3">
              Test your knowledge about market volatility and risk management during uncertain times.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>• 5 questions</span>
              <span>• 3 minutes</span>
              <span>• 80% to pass</span>
            </div>
          </div>
          
          <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium">
            <Play className="w-5 h-5" />
            Start Daily Challenge
          </button>
        </div>

        {/* Quick Learning Actions */}
        <div className="space-y-4">
          <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Quick Learn (5 min)
            </h4>
            <div className="space-y-2">
              <button className="w-full text-left p-3 bg-[#0a0e1a] rounded-lg hover:bg-gray-800 transition-colors">
                <div className="font-medium text-sm">What is P/E Ratio?</div>
                <div className="text-xs text-gray-400">Fundamental Analysis</div>
              </button>
              <button className="w-full text-left p-3 bg-[#0a0e1a] rounded-lg hover:bg-gray-800 transition-colors">
                <div className="font-medium text-sm">Reading Candlesticks</div>
                <div className="text-xs text-gray-400">Technical Analysis</div>
              </button>
              <button className="w-full text-left p-3 bg-[#0a0e1a] rounded-lg hover:bg-gray-800 transition-colors">
                <div className="font-medium text-sm">Risk vs Reward</div>
                <div className="text-xs text-gray-400">Risk Management</div>
              </button>
            </div>
          </div>

          <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Community
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Active Learners</span>
                <span className="text-green-400 font-medium">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Completed Today</span>
                <span className="text-blue-400 font-medium">89 lessons</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Your Rank</span>
                <span className="text-purple-400 font-medium">#156</span>
              </div>
            </div>
            <button className="w-full mt-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
              View Leaderboard
            </button>
          </div>
        </div>
      </div>

      {/* Learning Modules Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Learning Modules</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>{learningModules.length} modules available</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {learningModules.map((module) => {
            const progress = getModuleProgress(module.id);
            const isUnlocked = isModuleUnlocked(module);
            const isRecommended = recommendedModules.includes(module.id);

            return (
              <div
                key={module.id}
                className={`bg-[#131824] border rounded-lg p-6 transition-all hover:transform hover:scale-105 ${
                  isUnlocked
                    ? 'border-gray-800 hover:border-blue-500 cursor-pointer'
                    : 'border-gray-800 opacity-60'
                } ${isRecommended ? 'ring-2 ring-orange-500/50 shadow-lg shadow-orange-500/20' : ''}`}
              >
                {/* Module Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        module.category === 'fundamentals' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                        module.category === 'technical-analysis' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                        module.category === 'risk-management' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                        module.category === 'derivatives' ? 'bg-gradient-to-br from-purple-500 to-violet-500' :
                        module.category === 'portfolio-management' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                        module.category === 'crypto-trading' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
                        'bg-gradient-to-br from-gray-500 to-gray-600'
                      }`}>
                        {module.category === 'fundamentals' && <BookOpen className="w-6 h-6" />}
                        {module.category === 'technical-analysis' && <TrendingUp className="w-6 h-6" />}
                        {module.category === 'risk-management' && <Target className="w-6 h-6" />}
                        {module.category === 'derivatives' && <Target className="w-6 h-6" />}
                        {module.category === 'portfolio-management' && <Target className="w-6 h-6" />}
                        {module.category === 'crypto-trading' && <Target className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{module.title}</h3>
                        <div className="flex items-center gap-2">
                          {!isUnlocked && <Lock className="w-4 h-4 text-gray-500" />}
                          {progress === 100 && <CheckCircle className="w-4 h-4 text-green-400" />}
                          {isRecommended && <Zap className="w-4 h-4 text-orange-400" />}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{module.description}</p>
                  </div>
                </div>

                {/* Module Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400">{module.lessons.length} lessons</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400">{module.estimatedHours}h</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      module.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      module.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {module.difficulty}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400">{progress}%</div>
                  </div>
                </div>

                {/* Progress Bar */}
                {isUnlocked && (
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* Module Features */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {module.lessons.some(l => l.quiz) && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                      Quizzes
                    </span>
                  )}
                  {module.lessons.some(l => l.practicalExercise) && (
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                      Hands-On
                    </span>
                  )}
                  {module.certificate && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                      Certificate
                    </span>
                  )}
                  {isRecommended && (
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                      Recommended
                    </span>
                  )}
                </div>

                {/* Prerequisites */}
                {!isUnlocked && module.prerequisites.length > 0 && (
                  <div className="mb-4 p-3 bg-[#0a0e1a] rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400">
                      🔒 Complete these modules first: {
                        module.prerequisites.map(prereq => {
                          const prereqModule = learningModules.find(m => m.id === prereq);
                          return prereqModule?.title || prereq;
                        }).join(', ')
                      }
                    </p>
                  </div>
                )}

                {/* Action Button */}
                {isUnlocked ? (
                  <button className="w-full py-3 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2 font-medium">
                    <Play className="w-4 h-4" />
                    {progress === 0 ? 'Start Learning' : progress === 100 ? 'Review Module' : 'Continue Learning'}
                  </button>
                ) : (
                  <button 
                    disabled 
                    className="w-full py-3 bg-gray-700/50 border border-gray-600 rounded-lg cursor-not-allowed flex items-center justify-center gap-2 font-medium text-gray-500"
                  >
                    <Lock className="w-4 h-4" />
                    Locked
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Module Categories Overview */}
        <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Learning Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { category: 'fundamentals', name: 'Fundamentals', icon: BookOpen, color: 'from-green-500 to-emerald-500', count: learningModules.filter(m => m.category === 'fundamentals').length },
              { category: 'technical-analysis', name: 'Technical Analysis', icon: TrendingUp, color: 'from-blue-500 to-cyan-500', count: learningModules.filter(m => m.category === 'technical-analysis').length },
              { category: 'risk-management', name: 'Risk Management', icon: Target, color: 'from-red-500 to-pink-500', count: learningModules.filter(m => m.category === 'risk-management').length },
              { category: 'derivatives', name: 'Options & Derivatives', icon: Target, color: 'from-purple-500 to-violet-500', count: learningModules.filter(m => m.category === 'derivatives').length },
              { category: 'portfolio-management', name: 'Portfolio Management', icon: Target, color: 'from-yellow-500 to-orange-500', count: learningModules.filter(m => m.category === 'portfolio-management').length },
              { category: 'crypto-trading', name: 'Crypto Trading', icon: Target, color: 'from-orange-500 to-red-500', count: learningModules.filter(m => m.category === 'crypto-trading').length }
            ].map((cat) => (
              <div key={cat.category} className="text-center">
                <div className={`w-12 h-12 bg-gradient-to-br ${cat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <h4 className="font-medium text-sm mb-1">{cat.name}</h4>
                <p className="text-xs text-gray-400">{cat.count} module{cat.count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Learning Paths */}
      <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Structured Learning Paths</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {learningPaths.map((path) => (
            <div
              key={path.id}
              className="p-4 bg-[#0a0e1a] rounded-lg border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => setSelectedPath(path.id)}
            >
              <h4 className="font-bold mb-2">{path.name}</h4>
              <p className="text-sm text-gray-400 mb-3">{path.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{path.estimatedWeeks} weeks</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                  {path.targetAudience}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}