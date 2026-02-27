'use client';

import { useState } from 'react';
import { TrendingUp, Award, Calendar, Target, BookOpen, Zap, Trophy } from 'lucide-react';
import { UserProgress, Achievement } from '@/lib/learningSystem';

interface ProgressTrackerProps {
  userProgress: UserProgress;
  recentAchievements?: Achievement[];
}

export default function ProgressTracker({ userProgress, recentAchievements = [] }: ProgressTrackerProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');

  const calculateLevel = (xp: number): number => {
    return Math.floor(xp / 1000) + 1;
  };

  const getXPForNextLevel = (currentXP: number): number => {
    const currentLevel = calculateLevel(currentXP);
    return currentLevel * 1000 - currentXP;
  };

  const getLevelProgress = (currentXP: number): number => {
    const currentLevel = calculateLevel(currentXP);
    const levelStartXP = (currentLevel - 1) * 1000;
    const levelEndXP = currentLevel * 1000;
    return ((currentXP - levelStartXP) / (levelEndXP - levelStartXP)) * 100;
  };

  const getStreakStatus = (streak: number): { color: string; message: string } => {
    if (streak >= 30) return { color: 'text-purple-400', message: 'Legendary Streak!' };
    if (streak >= 14) return { color: 'text-blue-400', message: 'Amazing Consistency!' };
    if (streak >= 7) return { color: 'text-green-400', message: 'Great Momentum!' };
    if (streak >= 3) return { color: 'text-yellow-400', message: 'Building Habits!' };
    return { color: 'text-gray-400', message: 'Keep Going!' };
  };

  const getTotalLessonsCompleted = (): number => {
    return Object.values(userProgress.moduleProgress).reduce(
      (total, progress) => total + progress.completedLessons.length,
      0
    );
  };

  const getCompletedModules = (): number => {
    return Object.values(userProgress.moduleProgress).filter(
      progress => progress.completionDate
    ).length;
  };

  const getAverageQuizScore = (): number => {
    const allScores: number[] = [];
    Object.values(userProgress.moduleProgress).forEach(progress => {
      Object.values(progress.quizScores).forEach(score => allScores.push(score));
    });
    
    if (allScores.length === 0) return 0;
    return Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length);
  };

  const streakStatus = getStreakStatus(userProgress.learningStreak);

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold">Level {calculateLevel(userProgress.totalXP)}</h3>
            <p className="text-gray-400">
              {getXPForNextLevel(userProgress.totalXP)} XP to next level
            </p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8" />
          </div>
        </div>
        
        <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
            style={{ width: `${getLevelProgress(userProgress.totalXP)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-400">
          <span>{userProgress.totalXP} XP</span>
          <span>{calculateLevel(userProgress.totalXP) * 1000} XP</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Lessons</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{getTotalLessonsCompleted()}</div>
        </div>

        <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Modules</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{getCompletedModules()}</div>
        </div>

        <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Avg Quiz</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{getAverageQuizScore()}%</div>
        </div>

        <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-400">Streak</span>
          </div>
          <div className={`text-2xl font-bold ${streakStatus.color}`}>
            {userProgress.learningStreak}
          </div>
        </div>
      </div>

      {/* Learning Streak */}
      <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Learning Streak</h3>
          <div className={`px-3 py-1 rounded-full text-sm ${streakStatus.color} bg-current/20`}>
            {streakStatus.message}
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold">{userProgress.learningStreak} days</div>
          <div className="flex-1">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }, (_, i) => {
                const dayIndex = 6 - i;
                const isActive = dayIndex < userProgress.learningStreak;
                return (
                  <div
                    key={i}
                    className={`h-8 rounded ${
                      isActive 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                        : 'bg-gray-800'
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>7 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-400">
          Keep learning daily to maintain your streak and earn bonus XP!
        </p>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Recent Achievements</h3>
          <div className="space-y-3">
            {recentAchievements.slice(0, 3).map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-3 p-3 bg-[#0a0e1a] rounded-lg border border-gray-700"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">{achievement.name}</h4>
                  <p className="text-sm text-gray-400">{achievement.description}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {achievement.unlockedDate.toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Analytics */}
      <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Learning Analytics</h3>
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  selectedTimeframe === timeframe
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0a0e1a] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">XP Gained</span>
            </div>
            <div className="text-xl font-bold text-blue-400">
              {selectedTimeframe === 'week' ? '+420' : 
               selectedTimeframe === 'month' ? '+1,680' : 
               userProgress.totalXP}
            </div>
            <div className="text-xs text-gray-500">
              {selectedTimeframe === 'all' ? 'Total' : `This ${selectedTimeframe}`}
            </div>
          </div>

          <div className="p-4 bg-[#0a0e1a] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Study Time</span>
            </div>
            <div className="text-xl font-bold text-green-400">
              {selectedTimeframe === 'week' ? '8.5h' : 
               selectedTimeframe === 'month' ? '34h' : 
               '127h'}
            </div>
            <div className="text-xs text-gray-500">
              {selectedTimeframe === 'all' ? 'Total' : `This ${selectedTimeframe}`}
            </div>
          </div>

          <div className="p-4 bg-[#0a0e1a] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Achievements</span>
            </div>
            <div className="text-xl font-bold text-purple-400">
              {selectedTimeframe === 'week' ? '2' : 
               selectedTimeframe === 'month' ? '7' : 
               userProgress.achievements.length}
            </div>
            <div className="text-xs text-gray-500">
              {selectedTimeframe === 'all' ? 'Total' : `This ${selectedTimeframe}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}