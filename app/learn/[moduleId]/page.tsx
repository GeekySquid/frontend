'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, Clock, Target, Play, CheckCircle, Lock, Award } from 'lucide-react';
import { learningModules } from '@/lib/learningData';
import { Module, Lesson } from '@/lib/learningSystem';

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const moduleId = params.moduleId as string;
    const module = learningModules.find(m => m.id === moduleId);
    
    if (!module) {
      router.push('/learn');
      return;
    }

    setCurrentModule(module);
    
    // Mock user progress - in real app, fetch from backend/Supabase
    const mockProgress: Record<string, boolean> = {
      'what-is-stock-market': true,
      'types-of-investments': false,
      'chart-basics': false,
      'position-sizing': false
    };
    setUserProgress(mockProgress);
  }, [params, router]);

  const startLesson = (lesson: Lesson) => {
    if (!currentModule) return;
    router.push(`/learn/${currentModule.id}/${lesson.id}`);
  };

  const isLessonUnlocked = (lesson: Lesson, index: number): boolean => {
    if (index === 0) return true;
    
    // Check if all previous lessons are completed
    for (let i = 0; i < index; i++) {
      const prevLesson = currentModule?.lessons[i];
      if (prevLesson && !userProgress[prevLesson.id]) {
        return false;
      }
    }
    return true;
  };

  const getModuleProgress = (): number => {
    if (!currentModule) return 0;
    const completedLessons = currentModule.lessons.filter(lesson => userProgress[lesson.id]).length;
    return Math.round((completedLessons / currentModule.lessons.length) * 100);
  };

  const getTotalDuration = (): number => {
    if (!currentModule) return 0;
    return currentModule.lessons.reduce((total, lesson) => total + lesson.duration, 0);
  };

  if (!currentModule) {
    return (
      <div className="h-full bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8" />
          </div>
          <p className="text-gray-400">Loading module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0a0e1a] text-white overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Module Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/learn')}
            className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-2"
          >
            ← Back to Learning Dashboard
          </button>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3">{currentModule.title}</h1>
                <p className="text-gray-300 text-lg mb-4">{currentModule.description}</p>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>{currentModule.lessons.length} lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span>{Math.floor(getTotalDuration() / 60)}h {getTotalDuration() % 60}m</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className={`px-2 py-1 rounded text-xs ${
                      currentModule.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      currentModule.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {currentModule.difficulty}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-400 mb-2">{getModuleProgress()}%</div>
                <p className="text-gray-400">Complete</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${getModuleProgress()}%` }}
              />
            </div>

            {/* Prerequisites */}
            {currentModule.prerequisites.length > 0 && (
              <div className="bg-[#0a0e1a] border border-gray-700 rounded-lg p-4">
                <h3 className="font-bold mb-2">Prerequisites</h3>
                <p className="text-sm text-gray-400">
                  Complete these modules first: {currentModule.prerequisites.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="bg-[#131824] border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">What You'll Learn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentModule.lessons.slice(0, 4).map((lesson) => (
              <div key={lesson.id} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">{lesson.title}</h4>
                  <p className="text-sm text-gray-400">{lesson.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Lessons</h2>
          
          {currentModule.lessons.map((lesson, index) => {
            const isCompleted = userProgress[lesson.id];
            const isUnlocked = isLessonUnlocked(lesson, index);
            
            return (
              <div
                key={lesson.id}
                className={`bg-[#131824] border rounded-lg p-6 transition-all ${
                  isUnlocked
                    ? 'border-gray-800 hover:border-blue-500'
                    : 'border-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : isUnlocked ? (
                        <span className="text-sm font-bold">{index + 1}</span>
                      ) : (
                        <Lock className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">{lesson.title}</h3>
                      <p className="text-gray-400 mb-3">{lesson.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-4 h-4" />
                          {lesson.duration} min
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          lesson.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                          lesson.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {lesson.difficulty}
                        </span>
                        {lesson.quiz && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                            Quiz Included
                          </span>
                        )}
                        {lesson.practicalExercise && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                            Hands-On Exercise
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => startLesson(lesson)}
                    disabled={!isUnlocked}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isUnlocked
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    {isCompleted ? 'Review' : 'Start'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Module Certificate */}
        {currentModule.certificate && getModuleProgress() === 100 && (
          <div className="mt-8 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <Award className="w-12 h-12 text-yellow-400" />
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
                <p className="text-gray-300 mb-4">
                  You've completed the {currentModule.title} module. Claim your certificate!
                </p>
                <button className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-bold">
                  Download Certificate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}