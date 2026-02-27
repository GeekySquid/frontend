'use client';

import { useState, useEffect } from 'react';
import { Play, BookOpen, Target, Users, TrendingUp } from 'lucide-react';
import LearningDashboard from '@/components/learning/LearningDashboard';
import ProgressTracker from '@/components/learning/ProgressTracker';
import { UserProgress, Achievement } from '@/lib/learningSystem';
import { assessmentQuestions } from '@/lib/learningData';

export default function LearnPage() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'progress' | 'assessment'>('dashboard');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});

  // Mock user progress - in real app, this would come from your backend/Supabase
  useEffect(() => {
    const mockProgress: UserProgress = {
      userId: 'user-123',
      totalXP: 2840,
      level: 3,
      learningStreak: 12,
      lastActiveDate: new Date(),
      preferredLearningStyle: 'visual',
      moduleProgress: {
        'fundamentals-101': {
          moduleId: 'fundamentals-101',
          completedLessons: ['what-is-stock-market', 'types-of-investments'],
          currentLesson: 'types-of-investments',
          quizScores: { 'fundamentals-quiz-1': 85 },
          practicalExerciseScores: {},
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          completionDate: new Date(),
          timeSpent: 480,
          certificateEarned: true
        },
        'technical-analysis-101': {
          moduleId: 'technical-analysis-101',
          completedLessons: ['chart-basics'],
          currentLesson: 'chart-basics',
          quizScores: {},
          practicalExerciseScores: { 'chart-reading-exercise': 78 },
          startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          timeSpent: 180
        }
      },
      achievements: [
        {
          id: 'first-lesson',
          name: 'Getting Started',
          description: 'Complete your first lesson',
          badgeUrl: '/badges/first-lesson.svg',
          unlockedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          category: 'learning'
        },
        {
          id: 'week-streak',
          name: 'Dedicated Learner',
          description: 'Maintain a 7-day learning streak',
          badgeUrl: '/badges/week-streak.svg',
          unlockedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          category: 'streak'
        }
      ]
    };
    
    setUserProgress(mockProgress);
  }, []);

  const handleAssessmentSubmit = () => {
    // Calculate user level based on assessment
    const totalScore = Object.values(assessmentAnswers).reduce((sum, score) => sum + score, 0);
    const maxScore = assessmentQuestions.length * 75; // Max weight per question
    const percentage = (totalScore / maxScore) * 100;
    
    let recommendedPath = 'beginner-investor';
    if (percentage > 60) recommendedPath = 'day-trader-path';
    else if (percentage > 30) recommendedPath = 'intermediate-investor';
    
    setShowAssessment(false);
    // In real app, save assessment results and recommended path
    console.log('Assessment completed:', { totalScore, percentage, recommendedPath });
  };

  if (!userProgress) {
    return (
      <div className="h-full bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8" />
          </div>
          <p className="text-gray-400">Loading your learning progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0a0e1a] text-white overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                FINNEXUS Academy
              </h1>
              <p className="text-gray-400">Systematic financial education that adapts to market conditions</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAssessment(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors"
              >
                <Target className="w-4 h-4" />
                Skill Assessment
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 bg-[#131824] p-1 rounded-lg">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Learning Dashboard
            </button>
            <button
              onClick={() => setCurrentView('progress')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                currentView === 'progress'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Progress & Analytics
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && (
              <LearningDashboard 
                userProgress={userProgress}
                currentMarketCondition="high-volatility"
              />
            )}
            
            {currentView === 'progress' && (
              <ProgressTracker 
                userProgress={userProgress}
                recentAchievements={userProgress.achievements.slice(-3)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Skill Assessment Modal */}
      {showAssessment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#131824] border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Skill Assessment</h2>
            <p className="text-gray-400 mb-6">
              Help us personalize your learning experience by answering a few questions about your background and goals.
            </p>
            
            <div className="space-y-6">
              {assessmentQuestions.map((question, index) => (
                <div key={question.id}>
                  <h3 className="font-medium mb-3">{question.question}</h3>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        onClick={() => setAssessmentAnswers(prev => ({
                          ...prev,
                          [question.id]: question.weights[optionIndex]
                        }))}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          assessmentAnswers[question.id] === question.weights[optionIndex]
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-[#0a0e1a] border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAssessment(false)}
                className="flex-1 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Skip for Now
              </button>
              <button
                onClick={handleAssessmentSubmit}
                disabled={Object.keys(assessmentAnswers).length < assessmentQuestions.length}
                className="flex-1 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
