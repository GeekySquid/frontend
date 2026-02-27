'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Award, RotateCcw } from 'lucide-react';
import { Quiz, Question } from '@/lib/learningSystem';

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number, passed: boolean) => void;
  onRetry?: () => void;
}

export default function QuizComponent({ quiz, onComplete, onRetry }: QuizComponentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit || 0);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    if (quizStarted && quiz.timeLimit && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizStarted, timeLeft, quiz.timeLimit]);

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitQuiz = () => {
    const results = calculateResults();
    setShowResults(true);
    onComplete(results.score, results.passed);
  };

  const calculateResults = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    quiz.questions.forEach(question => {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      
      if (isAnswerCorrect(question, userAnswer)) {
        earnedPoints += question.points;
      }
    });

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const passed = score >= quiz.passingScore;

    return { score, passed, earnedPoints, totalPoints };
  };

  const isAnswerCorrect = (question: Question, userAnswer: string | string[] | undefined): boolean => {
    if (!userAnswer) return false;

    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return userAnswer === question.correctAnswer;
      case 'drag-drop':
        if (Array.isArray(userAnswer) && Array.isArray(question.correctAnswer)) {
          return JSON.stringify(userAnswer.sort()) === JSON.stringify(question.correctAnswer.sort());
        }
        return false;
      case 'calculation':
        return parseFloat(userAnswer as string) === question.correctAnswer;
      default:
        return false;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: Question) => {
    const userAnswer = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerChange(question.id, option)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  userAnswer === option
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-[#131824] border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    userAnswer === option ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
                  }`} />
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="grid grid-cols-2 gap-4">
            {['True', 'False'].map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerChange(question.id, option)}
                className={`p-4 rounded-lg border transition-colors ${
                  userAnswer === option
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-[#131824] border-gray-700 hover:border-gray-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'calculation':
        return (
          <div>
            <input
              type="number"
              step="any"
              placeholder="Enter your answer"
              value={userAnswer as string || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="w-full p-4 bg-[#131824] border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        );

      default:
        return <div>Question type not supported</div>;
    }
  };

  const renderResults = () => {
    const results = calculateResults();
    
    return (
      <div className="text-center space-y-6">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
          results.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {results.passed ? (
            <Award className="w-12 h-12" />
          ) : (
            <XCircle className="w-12 h-12" />
          )}
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-2">
            {results.passed ? 'Congratulations!' : 'Keep Learning!'}
          </h2>
          <p className="text-gray-400">
            {results.passed 
              ? 'You passed the quiz!' 
              : `You need ${quiz.passingScore}% to pass. Try again!`
            }
          </p>
        </div>

        <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">{results.score}%</div>
              <p className="text-sm text-gray-400">Final Score</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {results.earnedPoints}/{results.totalPoints}
              </div>
              <p className="text-sm text-gray-400">Points Earned</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {quiz.questions.filter(q => isAnswerCorrect(q, answers[q.id])).length}/{quiz.questions.length}
              </div>
              <p className="text-sm text-gray-400">Correct Answers</p>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="space-y-4 text-left">
          <h3 className="text-xl font-bold">Review Your Answers</h3>
          {quiz.questions.map((question, index) => {
            const isCorrect = isAnswerCorrect(question, answers[question.id]);
            const userAnswer = answers[question.id];

            return (
              <div key={question.id} className="bg-[#131824] border border-gray-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Question {index + 1}: {question.question}</h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-gray-400">Your answer:</span>{' '}
                        <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>
                          {userAnswer || 'No answer'}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p>
                          <span className="text-gray-400">Correct answer:</span>{' '}
                          <span className="text-green-400">{question.correctAnswer}</span>
                        </p>
                      )}
                      <p className="text-gray-300 mt-2">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 justify-center">
          {!results.passed && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          )}
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Module
          </button>
        </div>
      </div>
    );
  };

  if (!quizStarted) {
    return (
      <div className="h-full bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold mb-2">Quiz Time!</h1>
            <p className="text-gray-400">Test your knowledge with this quiz</p>
          </div>

          <div className="bg-[#131824] border border-gray-800 rounded-lg p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Questions:</span>
              <span>{quiz.questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Passing Score:</span>
              <span>{quiz.passingScore}%</span>
            </div>
            {quiz.timeLimit && (
              <div className="flex justify-between">
                <span className="text-gray-400">Time Limit:</span>
                <span>{formatTime(quiz.timeLimit)}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setQuizStarted(true)}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg hover:opacity-90 transition-opacity"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="h-full bg-[#0a0e1a] text-white p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {renderResults()}
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="h-full bg-[#0a0e1a] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Quiz in Progress</h1>
            <p className="text-gray-400">Question {currentQuestion + 1} of {quiz.questions.length}</p>
          </div>
          
          {quiz.timeLimit && (
            <div className="flex items-center gap-2 text-orange-400">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-1 rounded text-xs ${
                question.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {question.difficulty}
              </span>
              <span className="text-sm text-gray-400">{question.points} points</span>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">{question.question}</h2>
          </div>

          {renderQuestion(question)}
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="text-sm text-gray-400">
            {Object.keys(answers).length} of {quiz.questions.length} answered
          </div>

          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(answers).length < quiz.questions.length}
              className="px-6 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
              className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}