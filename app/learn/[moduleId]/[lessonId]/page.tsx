'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LessonViewer from '@/components/learning/LessonViewer';
import QuizComponent from '@/components/learning/QuizComponent';
import { learningModules } from '@/lib/learningData';
import { Lesson, Module } from '@/lib/learningSystem';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    const moduleId = params.moduleId as string;
    const lessonId = params.lessonId as string;

    const module = learningModules.find(m => m.id === moduleId);
    if (!module) {
      router.push('/learn');
      return;
    }

    const lessonIndex = module.lessons.findIndex(l => l.id === lessonId);
    const lesson = module.lessons[lessonIndex];
    
    if (!lesson) {
      router.push('/learn');
      return;
    }

    setCurrentModule(module);
    setCurrentLesson(lesson);
    setCurrentLessonIndex(lessonIndex);
  }, [params, router]);

  const handleLessonComplete = () => {
    if (currentLesson?.quiz) {
      setShowQuiz(true);
    } else {
      handleNext();
    }
  };

  const handleQuizComplete = (score: number, passed: boolean) => {
    console.log('Quiz completed:', { score, passed });
    // In real app, save quiz results to backend/Supabase
    setShowQuiz(false);
    handleNext();
  };

  const handleNext = () => {
    if (!currentModule) return;
    
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      const nextLesson = currentModule.lessons[currentLessonIndex + 1];
      router.push(`/learn/${currentModule.id}/${nextLesson.id}`);
    } else {
      // Module completed, redirect to learning dashboard
      router.push('/learn');
    }
  };

  const handlePrevious = () => {
    if (!currentModule) return;
    
    if (currentLessonIndex > 0) {
      const prevLesson = currentModule.lessons[currentLessonIndex - 1];
      router.push(`/learn/${currentModule.id}/${prevLesson.id}`);
    }
  };

  if (!currentModule || !currentLesson) {
    return (
      <div className="h-full bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <p className="text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (showQuiz && currentLesson.quiz) {
    return (
      <QuizComponent
        quiz={currentLesson.quiz}
        onComplete={handleQuizComplete}
        onRetry={() => setShowQuiz(true)}
      />
    );
  }

  return (
    <LessonViewer
      lesson={currentLesson}
      onComplete={handleLessonComplete}
      onNext={handleNext}
      onPrevious={handlePrevious}
      hasNext={currentLessonIndex < currentModule.lessons.length - 1}
      hasPrevious={currentLessonIndex > 0}
    />
  );
}