'use client';

import { useState, useEffect } from 'react';
import { 
  Lock, 
  CheckCircle, 
  Clock, 
  Award, 
  BookOpen, 
  Target, 
  TrendingUp,
  ArrowRight,
  Star,
  Shield
} from 'lucide-react';
import { QualificationStatus } from '@/lib/types/paper-trading';

interface QualificationGateProps {
  userId: string;
  children: React.ReactNode; // Paper trading interface to render when qualified
  onNavigateToModule?: (moduleId: string) => void;
  onNavigateToSimulation?: () => void;
}

interface QualificationProgressProps {
  status: QualificationStatus;
  onNavigateToModule?: (moduleId: string) => void;
  onNavigateToSimulation?: () => void;
}

export default function QualificationGate({ 
  userId, 
  children, 
  onNavigateToModule, 
  onNavigateToSimulation 
}: QualificationGateProps) {
  const [qualificationStatus, setQualificationStatus] = useState<QualificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQualificationStatus();
  }, [userId]);

  const fetchQualificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/learning/qualification-status?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch qualification status');
      }
      
      const data = await response.json();
      setQualificationStatus(data.qualificationStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Checking qualification status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Unable to Load</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchQualificationStatus}
              className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!qualificationStatus) {
    return (
      <div className="h-full bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">No qualification data available</p>
        </div>
      </div>
    );
  }

  // If user is qualified, render the paper trading interface
  if (qualificationStatus.isQualified) {
    return (
      <div className="h-full">
        {children}
      </div>
    );
  }

  // If not qualified, show qualification progress
  return (
    <QualificationProgress 
      status={qualificationStatus}
      onNavigateToModule={onNavigateToModule}
      onNavigateToSimulation={onNavigateToSimulation}
    />
  );
}

function QualificationProgress({ 
  status, 
  onNavigateToModule, 
  onNavigateToSimulation 
}: QualificationProgressProps) {
  // Calculate progress locally to avoid server-side imports
  const calculateProgress = (status: QualificationStatus) => {
    const requiredModules = status.requiredModules.length;
    const requiredSimulations = 5; // Default from requirements

    const moduleProgress = requiredModules > 0
      ? (status.completedModules.length / requiredModules) * 100
      : 100;

    const simulationProgress = requiredSimulations > 0
      ? Math.min((status.simulationCount / requiredSimulations) * 100, 100)
      : 100;

    const overallProgress = (moduleProgress + simulationProgress) / 2;

    return {
      moduleProgress: Math.round(moduleProgress),
      simulationProgress: Math.round(simulationProgress),
      overallProgress: Math.round(overallProgress)
    };
  };

  const getNextAction = (status: QualificationStatus): string | null => {
    if (status.isQualified) {
      return null;
    }

    if (status.missingRequirements.length > 0) {
      return status.missingRequirements[0];
    }

    return 'Complete remaining requirements to unlock paper trading';
  };

  const progress = calculateProgress(status);
  const nextAction = getNextAction(status);

  const handleModuleClick = (moduleId: string) => {
    if (onNavigateToModule) {
      onNavigateToModule(moduleId);
    }
  };

  const handleSimulationClick = () => {
    if (onNavigateToSimulation) {
      onNavigateToSimulation();
    }
  };

  return (
    <div className="h-full bg-[#0a0e1a] text-white overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10" />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold mb-2">Paper Trading Qualification</h1>
            <p className="text-gray-400 text-lg">
              Complete the requirements below to unlock paper trading
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Overall Progress</h2>
            <span className="text-2xl font-bold text-blue-400">{progress.overallProgress}%</span>
          </div>
          
          <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.overallProgress}%` }}
            />
          </div>
          
          {nextAction && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Target className="w-4 h-4" />
              <span>Next: {nextAction}</span>
            </div>
          )}
        </div>

        {/* Requirements Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Learning Modules */}
          <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Learning Modules</h3>
                <p className="text-sm text-gray-400">
                  {status.completedModules.length} of {status.requiredModules.length} completed
                </p>
              </div>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.moduleProgress}%` }}
              />
            </div>

            <div className="space-y-3">
              {status.requiredModules.map((moduleId) => {
                const isCompleted = status.completedModules.includes(moduleId);
                const score = status.quizScores[moduleId];
                
                return (
                  <div
                    key={moduleId}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isCompleted
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 cursor-pointer'
                    }`}
                    onClick={() => !isCompleted && handleModuleClick(moduleId)}
                  >
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium capitalize">
                          {moduleId.replace(/-/g, ' ')}
                        </p>
                        {isCompleted && score && (
                          <p className="text-sm text-green-400">Score: {score}%</p>
                        )}
                      </div>
                    </div>
                    
                    {!isCompleted && (
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trading Simulations */}
          <div className="bg-[#131824] border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Trading Simulations</h3>
                <p className="text-sm text-gray-400">
                  {status.simulationCount} of 5 completed
                </p>
              </div>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.simulationProgress}%` }}
              />
            </div>

            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => {
                const isCompleted = i < status.simulationCount;
                
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isCompleted
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : i === status.simulationCount
                        ? 'bg-gray-800/50 border-gray-600 hover:border-gray-500 cursor-pointer'
                        : 'bg-gray-800/30 border-gray-700/50'
                    }`}
                    onClick={() => i === status.simulationCount && handleSimulationClick()}
                  >
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-blue-400" />
                      ) : i === status.simulationCount ? (
                        <Clock className="w-5 h-5 text-gray-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                      )}
                      <p className="font-medium">
                        Simulation {i + 1}
                        {i === status.simulationCount && !isCompleted && (
                          <span className="text-sm text-gray-400 ml-2">(Available)</span>
                        )}
                      </p>
                    </div>
                    
                    {i === status.simulationCount && !isCompleted && (
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>

            {status.simulationCount < 5 && (
              <button
                onClick={handleSimulationClick}
                className="w-full mt-4 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Start Next Simulation
              </button>
            )}
          </div>
        </div>

        {/* Qualification Benefits */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-bold">What You'll Unlock</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">Real-time paper trading</span>
            </div>
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">Advanced analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">Performance tracking</span>
            </div>
          </div>
        </div>

        {/* Missing Requirements Alert */}
        {status.missingRequirements.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <h4 className="font-medium text-orange-400">Missing Requirements</h4>
            </div>
            <ul className="text-sm text-gray-300 space-y-1">
              {status.missingRequirements.map((requirement, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-orange-400 rounded-full" />
                  {requirement}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}