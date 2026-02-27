// Learning System Core Types and Data
import { UserQualificationsDAL } from './database/dal/user-qualifications';
import { QualificationStatus } from './types/paper-trading';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: LessonContent;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  learningObjectives: string[];
  quiz?: Quiz;
  practicalExercise?: PracticalExercise;
}

export interface LessonContent {
  type: 'text' | 'video' | 'interactive' | 'simulation';
  sections: ContentSection[];
}

export interface ContentSection {
  id: string;
  title: string;
  type: 'text' | 'image' | 'chart' | 'code' | 'formula' | 'interactive';
  content: string;
  metadata?: {
    imageUrl?: string;
    chartData?: any;
    interactiveType?: string;
  };
}

export interface Quiz {
  id: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'drag-drop' | 'calculation' | 'scenario';
  question: string;
  options?: string[];
  correctAnswer: string | number | string[];
  explanation: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PracticalExercise {
  id: string;
  title: string;
  description: string;
  type: 'portfolio-simulation' | 'chart-analysis' | 'calculation' | 'strategy-building';
  instructions: string[];
  expectedOutcome: string;
  hints: string[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  category: LearningCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  prerequisites: string[];
  lessons: Lesson[];
  finalProject?: PracticalExercise;
  certificate?: Certificate;
  marketRelevance: MarketCondition[];
}

export interface Certificate {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  badgeUrl: string;
}

export type LearningCategory = 
  | 'fundamentals'
  | 'technical-analysis'
  | 'fundamental-analysis'
  | 'risk-management'
  | 'derivatives'
  | 'portfolio-management'
  | 'behavioral-finance'
  | 'market-psychology'
  | 'quantitative-analysis'
  | 'crypto-trading';

export type MarketCondition = 
  | 'bull-market'
  | 'bear-market'
  | 'high-volatility'
  | 'low-volatility'
  | 'earnings-season'
  | 'fed-meetings'
  | 'market-crash'
  | 'always-relevant';

export interface UserProgress {
  userId: string;
  moduleProgress: Record<string, ModuleProgress>;
  totalXP: number;
  level: number;
  achievements: Achievement[];
  learningStreak: number;
  lastActiveDate: Date;
  preferredLearningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
}

export interface ModuleProgress {
  moduleId: string;
  completedLessons: string[];
  currentLesson?: string;
  quizScores: Record<string, number>;
  practicalExerciseScores: Record<string, number>;
  startDate: Date;
  completionDate?: Date;
  timeSpent: number; // in minutes
  certificateEarned?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  badgeUrl: string;
  unlockedDate: Date;
  category: 'learning' | 'quiz' | 'streak' | 'practical' | 'social';
}

// Learning Path System
export interface LearningPath {
  id: string;
  name: string;
  description: string;
  targetAudience: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  estimatedWeeks: number;
  modules: string[]; // module IDs in order
  goals: string[];
  careerOutcomes: string[];
}

// Adaptive Learning System
export interface AdaptiveLearningEngine {
  assessUserLevel(userId: string): Promise<'beginner' | 'intermediate' | 'advanced'>;
  recommendNextLesson(userId: string, currentModule: string): Promise<string>;
  adjustDifficulty(userId: string, performance: number): Promise<void>;
  getPersonalizedPath(userId: string): Promise<LearningPath>;
}

// ============================================================================
// Qualification Tracking System
// ============================================================================

export interface QualificationTracker {
  checkUserQualification(userId: string): Promise<QualificationStatus>;
  updateProgress(userId: string, moduleId: string, score: number): Promise<void>;
  unlockPaperTrading(userId: string): Promise<void>;
  incrementSimulationCount(userId: string): Promise<void>;
  getQualificationRequirements(): QualificationRequirements;
}

export interface QualificationRequirements {
  requiredModules: string[];
  minimumQuizScore: number;
  requiredSimulations: number;
}

export class LearningSystemQualificationTracker implements QualificationTracker {
  private qualificationsDAL: UserQualificationsDAL;
  private requirements: QualificationRequirements;

  constructor(
    qualificationsDAL?: UserQualificationsDAL,
    requirements?: Partial<QualificationRequirements>
  ) {
    this.qualificationsDAL = qualificationsDAL || new UserQualificationsDAL();
    this.requirements = {
      requiredModules: [
        'fundamentals-basics',
        'risk-management-essentials',
        'technical-analysis-intro',
        'market-psychology-basics'
      ],
      minimumQuizScore: 70,
      requiredSimulations: 5,
      ...requirements
    };
  }

  async checkUserQualification(userId: string): Promise<QualificationStatus> {
    return await this.qualificationsDAL.calculateQualificationStatus(
      userId,
      this.requirements.requiredModules,
      this.requirements.minimumQuizScore,
      this.requirements.requiredSimulations
    );
  }

  async updateProgress(userId: string, moduleId: string, score: number): Promise<void> {
    // Record module completion
    await this.qualificationsDAL.addModuleCompletion(userId, moduleId, score);

    // Check if user is now qualified and update status
    const qualificationStatus = await this.checkUserQualification(userId);

    if (qualificationStatus.isQualified) {
      await this.unlockPaperTrading(userId);
    }
  }

  async unlockPaperTrading(userId: string): Promise<void> {
    const qualificationStatus = await this.checkUserQualification(userId);

    if (qualificationStatus.isQualified) {
      await this.qualificationsDAL.updateQualificationStatus(
        userId,
        true,
        qualificationStatus.totalScore
      );
    }
  }

  async incrementSimulationCount(userId: string): Promise<void> {
    await this.qualificationsDAL.incrementSimulationCount(userId);

    // Check if user is now qualified after simulation completion
    const qualificationStatus = await this.checkUserQualification(userId);

    if (qualificationStatus.isQualified) {
      await this.unlockPaperTrading(userId);
    }
  }

  getQualificationRequirements(): QualificationRequirements {
    return { ...this.requirements };
  }
}

// ============================================================================
// Enhanced Learning System with Qualification Integration
// ============================================================================

export interface EnhancedUserProgress extends UserProgress {
  qualificationStatus?: QualificationStatus;
  paperTradingUnlocked: boolean;
}

export class LearningSystemManager {
  private qualificationTracker: QualificationTracker;

  constructor(qualificationTracker?: QualificationTracker) {
    this.qualificationTracker = qualificationTracker || new LearningSystemQualificationTracker();
  }

  /**
   * Get enhanced user progress including qualification status
   */
  async getEnhancedUserProgress(userId: string, baseProgress: UserProgress): Promise<EnhancedUserProgress> {
    const qualificationStatus = await this.qualificationTracker.checkUserQualification(userId);

    return {
      ...baseProgress,
      qualificationStatus,
      paperTradingUnlocked: qualificationStatus.isQualified
    };
  }

  /**
   * Process quiz completion and update qualification progress
   */
  async processQuizCompletion(
    userId: string,
    moduleId: string,
    score: number,
    baseProgress: UserProgress
  ): Promise<EnhancedUserProgress> {
    // Update qualification tracking
    await this.qualificationTracker.updateProgress(userId, moduleId, score);

    // Return updated progress
    return await this.getEnhancedUserProgress(userId, baseProgress);
  }

  /**
   * Process simulation completion and update qualification progress
   */
  async processSimulationCompletion(
    userId: string,
    baseProgress: UserProgress
  ): Promise<EnhancedUserProgress> {
    // Increment simulation count
    await this.qualificationTracker.incrementSimulationCount(userId);

    // Return updated progress
    return await this.getEnhancedUserProgress(userId, baseProgress);
  }

  /**
   * Check if user can access paper trading
   */
  async canAccessPaperTrading(userId: string): Promise<boolean> {
    const qualificationStatus = await this.qualificationTracker.checkUserQualification(userId);
    return qualificationStatus.isQualified;
  }

  /**
   * Get qualification requirements for display
   */
  getQualificationRequirements(): QualificationRequirements {
    return this.qualificationTracker.getQualificationRequirements();
  }

  /**
   * Get detailed qualification status for progress display
   */
  async getQualificationProgress(userId: string): Promise<QualificationStatus> {
    return await this.qualificationTracker.checkUserQualification(userId);
  }
}

// ============================================================================
// Utility Functions for Learning System Integration
// ============================================================================

/**
 * Calculate completion percentage for qualification requirements
 */
export function calculateQualificationProgress(status: QualificationStatus): {
  moduleProgress: number;
  simulationProgress: number;
  overallProgress: number;
} {
  const requirements = {
    requiredModules: status.requiredModules.length,
    requiredSimulations: 5 // Default from requirements
  };

  const moduleProgress = requirements.requiredModules > 0
    ? (status.completedModules.length / requirements.requiredModules) * 100
    : 100;

  const simulationProgress = requirements.requiredSimulations > 0
    ? Math.min((status.simulationCount / requirements.requiredSimulations) * 100, 100)
    : 100;

  const overallProgress = (moduleProgress + simulationProgress) / 2;

  return {
    moduleProgress: Math.round(moduleProgress),
    simulationProgress: Math.round(simulationProgress),
    overallProgress: Math.round(overallProgress)
  };
}

/**
 * Get next required action for qualification
 */
export function getNextQualificationAction(status: QualificationStatus): string | null {
  if (status.isQualified) {
    return null;
  }

  if (status.missingRequirements.length > 0) {
    return status.missingRequirements[0];
  }

  return 'Complete remaining requirements to unlock paper trading';
}

/**
 * Check if a module is required for qualification
 */
export function isModuleRequired(moduleId: string, requirements: QualificationRequirements): boolean {
  return requirements.requiredModules.includes(moduleId);
}

/**
 * Get qualification badge level based on scores
 */
export function getQualificationBadgeLevel(status: QualificationStatus): 'bronze' | 'silver' | 'gold' | null {
  if (!status.isQualified) {
    return null;
  }

  const averageScore = status.totalScore / status.completedModules.length;

  if (averageScore >= 90) {
    return 'gold';
  } else if (averageScore >= 80) {
    return 'silver';
  } else {
    return 'bronze';
  }
}