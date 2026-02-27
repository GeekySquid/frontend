// Database Initialization Script
// Sets up the paper trading database schema and initial data

import { initializeDatabase, checkDatabaseHealth } from './connection';
import { getDatabaseService } from './dal';

/**
 * Initialize the paper trading database
 * This should be called during application startup
 */
export async function initializePaperTradingDatabase(): Promise<void> {
  console.log('[DB Init] Starting paper trading database initialization...');
  
  try {
    // Initialize database connection and run migrations
    await initializeDatabase();
    
    // Verify database health
    const health = await checkDatabaseHealth();
    if (!health.healthy) {
      throw new Error(`Database health check failed: ${health.message}`);
    }
    
    // Get database service and run component health check
    const dbService = await getDatabaseService();
    const componentHealth = await dbService.healthCheck();
    
    if (!componentHealth.overall) {
      console.warn('[DB Init] Some database components are not fully accessible:', componentHealth.components);
      console.warn('[DB Init] This is normal for a fresh installation. Tables will be created on first use.');
    }
    
    // Log database statistics
    const stats = await dbService.getStats();
    console.log('[DB Init] Database statistics:', {
      totalUsers: stats.totalUsers,
      qualifiedUsers: stats.qualifiedUsers,
      totalTrades: stats.totalTrades,
      activeSessions: stats.activeSessions,
      totalAnalytics: stats.totalAnalytics,
      totalTicks: stats.totalTicks,
      uniqueSymbols: stats.uniqueSymbols
    });
    
    console.log('[DB Init] Paper trading database initialization completed successfully');
  } catch (error) {
    console.error('[DB Init] Failed to initialize paper trading database:', error);
    throw error;
  }
}

/**
 * Seed the database with initial test data (for development)
 */
export async function seedTestData(): Promise<void> {
  console.log('[DB Seed] Seeding test data...');
  
  try {
    const dbService = await getDatabaseService();
    
    // Create a test user qualification
    const testUserId = 'test-user-123';
    
    await dbService.transaction(async (tx) => {
      // Create user qualification
      const userQual = await tx.userQualifications.createUserQualification(testUserId);
      console.log('[DB Seed] Created test user qualification:', userQual.id);
      
      // Add some module completions
      await tx.userQualifications.addModuleCompletion(testUserId, 'fundamentals-101', 85);
      await tx.userQualifications.addModuleCompletion(testUserId, 'technical-analysis-101', 92);
      
      // Update qualification status
      await tx.userQualifications.updateQualificationStatus(testUserId, true, 177);
      
      // Create a test trading session
      const session = await tx.tradingSessions.createSession(testUserId);
      console.log('[DB Seed] Created test trading session:', session.id);
      
      // Add some test market data
      const testSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
      const testTicks = testSymbols.map(symbol => ({
        symbol,
        price: 100 + Math.random() * 200,
        volume: Math.floor(Math.random() * 1000000),
        source: 'test-data'
      }));
      
      await tx.marketTicks.storeMultipleTicks(testTicks);
      console.log('[DB Seed] Created test market data for symbols:', testSymbols);
    });
    
    console.log('[DB Seed] Test data seeding completed successfully');
  } catch (error) {
    console.error('[DB Seed] Failed to seed test data:', error);
    throw error;
  }
}

/**
 * Clean up test data (for development)
 */
export async function cleanupTestData(): Promise<void> {
  console.log('[DB Cleanup] Cleaning up test data...');
  
  try {
    const dbService = await getDatabaseService();
    const testUserId = 'test-user-123';
    
    await dbService.transaction(async (tx) => {
      // Delete user data (cascades to sessions and trades)
      await tx.userQualifications.deleteUserQualification(testUserId);
      
      // Clean up old market data
      await tx.marketTicks.cleanupOldTicks(1); // Keep only last day
    });
    
    console.log('[DB Cleanup] Test data cleanup completed');
  } catch (error) {
    console.error('[DB Cleanup] Failed to cleanup test data:', error);
    throw error;
  }
}

/**
 * Perform database maintenance tasks
 */
export async function performMaintenance(): Promise<void> {
  console.log('[DB Maintenance] Starting database maintenance...');
  
  try {
    const dbService = await getDatabaseService();
    
    // Clean up old data
    const cleanup = await dbService.cleanup({
      tickRetentionDays: 30,
      analyticsRetentionDays: 90,
      completedSessionRetentionDays: 365
    });
    
    console.log('[DB Maintenance] Cleanup results:', cleanup);
    
    // Get updated statistics
    const stats = await dbService.getStats();
    console.log('[DB Maintenance] Updated database statistics:', stats);
    
    console.log('[DB Maintenance] Database maintenance completed');
  } catch (error) {
    console.error('[DB Maintenance] Database maintenance failed:', error);
    throw error;
  }
}

/**
 * Validate database schema and data integrity
 */
export async function validateDatabase(): Promise<{
  valid: boolean;
  issues: string[];
  recommendations: string[];
}> {
  console.log('[DB Validate] Validating database schema and data integrity...');
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    const dbService = await getDatabaseService();
    
    // Check component health
    const health = await dbService.healthCheck();
    if (!health.overall) {
      issues.push('Some database components are not accessible');
      recommendations.push('Run database migrations to ensure all tables exist');
    }
    
    // Check for orphaned records (would require more complex queries)
    // For now, just validate basic connectivity and table access
    
    // Check statistics for anomalies
    const stats = await dbService.getStats();
    
    if (stats.totalTrades > 0 && stats.totalAnalytics === 0) {
      issues.push('Trades exist without corresponding analytics');
      recommendations.push('Run analytics generation for existing trades');
    }
    
    if (stats.activeSessions > stats.totalUsers) {
      issues.push('More active sessions than total users');
      recommendations.push('Check for session cleanup issues');
    }
    
    const valid = issues.length === 0;
    
    console.log('[DB Validate] Validation completed:', { valid, issues: issues.length, recommendations: recommendations.length });
    
    return { valid, issues, recommendations };
  } catch (error) {
    console.error('[DB Validate] Database validation failed:', error);
    return {
      valid: false,
      issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Check database connectivity and permissions']
    };
  }
}

// Export initialization function for use in Next.js API routes or startup scripts
export default initializePaperTradingDatabase;