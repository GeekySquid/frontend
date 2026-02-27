// Data Access Layer - User Qualifications
// Handles database operations for user qualification tracking

import { DatabaseConnection, getDatabase } from '../connection';
import { 
  UserQualification, 
  QualificationModule, 
  QualificationStatus 
} from '../../types/paper-trading';

export class UserQualificationsDAL {
  private db: DatabaseConnection;

  constructor(db?: DatabaseConnection) {
    this.db = db || null as any; // Will be initialized in methods
  }

  private async getDb(): Promise<DatabaseConnection> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  // ============================================================================
  // User Qualification Operations
  // ============================================================================

  async getUserQualification(userId: string): Promise<UserQualification | null> {
    const db = await this.getDb();
    
    const result = await db.queryOne<UserQualification>(
      `SELECT 
        id, user_id as "userId", is_qualified as "isQualified",
        qualification_date as "qualificationDate", total_score as "totalScore",
        simulations_completed as "simulationsCompleted",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM user_qualifications 
      WHERE user_id = $1`,
      [userId]
    );

    return result;
  }

  async createUserQualification(userId: string): Promise<UserQualification> {
    const db = await this.getDb();
    
    const result = await db.queryOne<UserQualification>(
      `INSERT INTO user_qualifications (user_id, is_qualified, total_score, simulations_completed)
      VALUES ($1, false, 0, 0)
      RETURNING 
        id, user_id as "userId", is_qualified as "isQualified",
        qualification_date as "qualificationDate", total_score as "totalScore",
        simulations_completed as "simulationsCompleted",
        created_at as "createdAt", updated_at as "updatedAt"`,
      [userId]
    );

    if (!result) {
      throw new Error('Failed to create user qualification record');
    }

    return result;
  }

  async updateQualificationStatus(
    userId: string, 
    isQualified: boolean, 
    totalScore?: number
  ): Promise<UserQualification> {
    const db = await this.getDb();
    
    const qualificationDate = isQualified ? new Date() : null;
    
    const result = await db.queryOne<UserQualification>(
      `UPDATE user_qualifications 
      SET 
        is_qualified = $2,
        qualification_date = $3,
        total_score = COALESCE($4, total_score),
        updated_at = NOW()
      WHERE user_id = $1
      RETURNING 
        id, user_id as "userId", is_qualified as "isQualified",
        qualification_date as "qualificationDate", total_score as "totalScore",
        simulations_completed as "simulationsCompleted",
        created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, isQualified, qualificationDate, totalScore]
    );

    if (!result) {
      throw new Error('Failed to update qualification status');
    }

    return result;
  }

  async incrementSimulationCount(userId: string): Promise<void> {
    const db = await this.getDb();
    
    await db.execute(
      `UPDATE user_qualifications 
      SET 
        simulations_completed = simulations_completed + 1,
        updated_at = NOW()
      WHERE user_id = $1`,
      [userId]
    );
  }

  // ============================================================================
  // Module Completion Operations
  // ============================================================================

  async getCompletedModules(userId: string): Promise<QualificationModule[]> {
    const db = await this.getDb();
    
    const results = await db.query<QualificationModule>(
      `SELECT 
        id, user_id as "userId", module_id as "moduleId",
        completion_date as "completionDate", score, attempts,
        created_at as "createdAt"
      FROM qualification_modules 
      WHERE user_id = $1
      ORDER BY completion_date DESC`,
      [userId]
    );

    return results;
  }

  async addModuleCompletion(
    userId: string,
    moduleId: string,
    score: number,
    attempts: number = 1
  ): Promise<QualificationModule> {
    const db = await this.getDb();
    
    // Use UPSERT to handle retakes
    const result = await db.queryOne<QualificationModule>(
      `INSERT INTO qualification_modules (user_id, module_id, completion_date, score, attempts)
      VALUES ($1, $2, NOW(), $3, $4)
      ON CONFLICT (user_id, module_id) 
      DO UPDATE SET 
        completion_date = NOW(),
        score = GREATEST(qualification_modules.score, $3),
        attempts = qualification_modules.attempts + 1
      RETURNING 
        id, user_id as "userId", module_id as "moduleId",
        completion_date as "completionDate", score, attempts,
        created_at as "createdAt"`,
      [userId, moduleId, score, attempts]
    );

    if (!result) {
      throw new Error('Failed to record module completion');
    }

    return result;
  }

  async getModuleScore(userId: string, moduleId: string): Promise<number | null> {
    const db = await this.getDb();
    
    const result = await db.queryOne<{ score: number }>(
      'SELECT score FROM qualification_modules WHERE user_id = $1 AND module_id = $2',
      [userId, moduleId]
    );

    return result?.score || null;
  }

  // ============================================================================
  // Qualification Status Calculation
  // ============================================================================

  async calculateQualificationStatus(
    userId: string,
    requiredModules: string[],
    minimumScore: number = 70,
    requiredSimulations: number = 5
  ): Promise<QualificationStatus> {
    const db = await this.getDb();
    
    // Get user qualification record
    let userQual = await this.getUserQualification(userId);
    if (!userQual) {
      userQual = await this.createUserQualification(userId);
    }

    // Get completed modules
    const completedModules = await this.getCompletedModules(userId);
    
    // Calculate qualification status
    const completedModuleIds = completedModules
      .filter(m => m.score >= minimumScore)
      .map(m => m.moduleId);
    
    const quizScores = completedModules.reduce((acc, module) => {
      acc[module.moduleId] = module.score;
      return acc;
    }, {} as Record<string, number>);

    const missingRequirements: string[] = [];
    
    // Check required modules
    const missingModules = requiredModules.filter(
      moduleId => !completedModuleIds.includes(moduleId)
    );
    
    if (missingModules.length > 0) {
      missingRequirements.push(
        `Complete required modules: ${missingModules.join(', ')}`
      );
    }

    // Check simulation requirement
    if (userQual.simulationsCompleted < requiredSimulations) {
      missingRequirements.push(
        `Complete ${requiredSimulations - userQual.simulationsCompleted} more simulations`
      );
    }

    // Check if qualified
    const isQualified = missingRequirements.length === 0;
    
    // Update qualification status if it changed
    if (isQualified !== userQual.isQualified) {
      const totalScore = Object.values(quizScores).reduce((sum, score) => sum + score, 0);
      userQual = await this.updateQualificationStatus(userId, isQualified, totalScore);
    }

    return {
      isQualified,
      completedModules: completedModuleIds,
      requiredModules,
      quizScores,
      simulationCount: userQual.simulationsCompleted,
      qualificationDate: userQual.qualificationDate,
      totalScore: userQual.totalScore,
      missingRequirements
    };
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  async getQualifiedUsers(limit: number = 100): Promise<UserQualification[]> {
    const db = await this.getDb();
    
    const results = await db.query<UserQualification>(
      `SELECT 
        id, user_id as "userId", is_qualified as "isQualified",
        qualification_date as "qualificationDate", total_score as "totalScore",
        simulations_completed as "simulationsCompleted",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM user_qualifications 
      WHERE is_qualified = true
      ORDER BY qualification_date DESC
      LIMIT $1`,
      [limit]
    );

    return results;
  }

  async getQualificationStats(): Promise<{
    totalUsers: number;
    qualifiedUsers: number;
    qualificationRate: number;
    averageScore: number;
    averageSimulations: number;
  }> {
    const db = await this.getDb();
    
    const stats = await db.queryOne<{
      total_users: number;
      qualified_users: number;
      avg_score: number;
      avg_simulations: number;
    }>(
      `SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_qualified = true) as qualified_users,
        AVG(total_score) as avg_score,
        AVG(simulations_completed) as avg_simulations
      FROM user_qualifications`
    );

    if (!stats) {
      return {
        totalUsers: 0,
        qualifiedUsers: 0,
        qualificationRate: 0,
        averageScore: 0,
        averageSimulations: 0
      };
    }

    return {
      totalUsers: stats.total_users,
      qualifiedUsers: stats.qualified_users,
      qualificationRate: stats.total_users > 0 
        ? (stats.qualified_users / stats.total_users) * 100 
        : 0,
      averageScore: Math.round(stats.avg_score || 0),
      averageSimulations: Math.round(stats.avg_simulations || 0)
    };
  }

  // ============================================================================
  // Cleanup Operations
  // ============================================================================

  async deleteUserQualification(userId: string): Promise<void> {
    const db = await this.getDb();
    
    await db.transaction(async (tx) => {
      // Delete module completions first (foreign key constraint)
      await tx.execute(
        'DELETE FROM qualification_modules WHERE user_id = $1',
        [userId]
      );
      
      // Delete qualification record
      await tx.execute(
        'DELETE FROM user_qualifications WHERE user_id = $1',
        [userId]
      );
    });
  }

  async resetUserProgress(userId: string): Promise<void> {
    const db = await this.getDb();
    
    await db.transaction(async (tx) => {
      // Reset qualification status
      await tx.execute(
        `UPDATE user_qualifications 
        SET 
          is_qualified = false,
          qualification_date = NULL,
          total_score = 0,
          simulations_completed = 0,
          updated_at = NOW()
        WHERE user_id = $1`,
        [userId]
      );
      
      // Delete all module completions
      await tx.execute(
        'DELETE FROM qualification_modules WHERE user_id = $1',
        [userId]
      );
    });
  }
}