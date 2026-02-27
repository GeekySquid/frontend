'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Clock, Target, CheckCircle, Play, Pause } from 'lucide-react';
import { Lesson, ContentSection } from '@/lib/learningSystem';

interface LessonViewerProps {
  lesson: Lesson;
  onComplete: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export default function LessonViewer({
  lesson,
  onComplete,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}: LessonViewerProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [startTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const markSectionComplete = (sectionIndex: number) => {
    setCompletedSections(prev => new Set([...prev, sectionIndex]));
  };

  const isLessonComplete = completedSections.size === lesson.content.sections.length;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderContentSection = (section: ContentSection) => {
    switch (section.type) {
      case 'text':
        return (
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </div>
        );

      case 'interactive':
        return (
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6">
            <div className="text-center">
              <Play className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h4 className="text-lg font-bold mb-2">Interactive Content</h4>
              <p className="text-gray-400 mb-4">{section.content}</p>
              <button className="px-6 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                Start Interactive Exercise
              </button>
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="bg-[#0a0e1a] border border-gray-700 rounded-lg p-6">
            <div className="text-center">
              <div className="w-full h-64 bg-gradient-to-br from-green-500/20 to-red-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-gray-400">Chart Visualization: {section.content}</span>
              </div>
            </div>
          </div>
        );

      case 'formula':
        return (
          <div className="bg-[#0a0e1a] border border-gray-700 rounded-lg p-6">
            <div className="text-center">
              <div className="text-2xl font-mono text-blue-400 mb-4">
                {section.content}
              </div>
              <p className="text-sm text-gray-400">Mathematical Formula</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-gray-300">
            {section.content}
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-[#0a0e1a] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{lesson.title}</h1>
              <p className="text-gray-400">{lesson.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-4 h-4" />
              {formatTime(timeSpent)} / {lesson.duration}min
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <Target className="w-4 h-4" />
              {completedSections.size}/{lesson.content.sections.length} sections
            </div>
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="bg-[#131824] border border-gray-800 rounded-lg p-4">
          <h3 className="font-bold mb-2">Learning Objectives</h3>
          <ul className="space-y-1">
            {lesson.learningObjectives.map((objective, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                {objective}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Section Navigation */}
        <div className="w-64 border-r border-gray-800 p-4 overflow-y-auto">
          <h3 className="font-bold mb-4">Sections</h3>
          <div className="space-y-2">
            {lesson.content.sections.map((section, index) => (
              <button
                key={index}
                onClick={() => setCurrentSection(index)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentSection === index
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'bg-[#131824] border border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {completedSections.has(index) ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <div className="w-4 h-4 border border-gray-600 rounded-full" />
                  )}
                  <span className="text-sm font-medium">{section.title}</span>
                </div>
                <div className="text-xs text-gray-400 capitalize">{section.type} content</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            {lesson.content.sections[currentSection] && (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  {lesson.content.sections[currentSection].title}
                </h2>
                {renderContentSection(lesson.content.sections[currentSection])}
              </div>
            )}
          </div>

          {/* Section Controls */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                disabled={currentSection === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Section
              </button>

              <button
                onClick={() => markSectionComplete(currentSection)}
                disabled={completedSections.has(currentSection)}
                className="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completedSections.has(currentSection) ? 'Completed' : 'Mark Complete'}
              </button>

              <button
                onClick={() => setCurrentSection(Math.min(lesson.content.sections.length - 1, currentSection + 1))}
                disabled={currentSection === lesson.content.sections.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Section
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Controls */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Lesson
          </button>

          <div className="flex items-center gap-3">
            {isLessonComplete && (
              <button
                onClick={onComplete}
                className="px-6 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
              >
                Complete Lesson
              </button>
            )}
            
            <button
              onClick={onNext}
              disabled={!hasNext || !isLessonComplete}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Lesson
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}