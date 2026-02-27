// Database Connection and Migration Management
// Handles database connections and schema migrations for the paper trading system

import { readFileSync } from 'fs';
import { join } from 'path';

// Database connection interface
export interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ rowCount: number; insertId?: string }>;
  transaction<T>(callback: (db: DatabaseConnection) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

// Mock database implementation for development
// In production, this would be replaced with actual database drivers (PostgreSQL, MySQL, etc.)
class MockDatabaseConnection implements DatabaseConnection {
  private data: Map<string, any[]> = new Map();
  private isConnected = false;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize empty tables
    this.data.set('user_qualifications', []);
    this.data.set('qualification_modules', []);
    this.data.set('trading_sessions', []);
    this.data.set('paper_trades', []);
    this.data.set('trade_analytics', []);
    this.data.set('market_ticks', []);
    this.isConnected = true;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    // Simple mock implementation - in production, use actual SQL execution
    console.log(`[DB Query] ${sql}`, params ? `Params: ${JSON.stringify(params)}` : '');
    
    // For mock purposes, return empty array
    // In production, this would execute the actual SQL query
    return [] as T[];
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  async execute(sql: string, params?: any[]): Promise<{ rowCount: number; insertId?: string }> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    console.log(`[DB Execute] ${sql}`, params ? `Params: ${JSON.stringify(params)}` : '');
    
    // Mock execution result
    return {
      rowCount: 1,
      insertId: this.generateId()
    };
  }

  async transaction<T>(callback: (db: DatabaseConnection) => Promise<T>): Promise<T> {
    // Mock transaction - in production, use actual database transactions
    console.log('[DB Transaction] Starting transaction');
    try {
      const result = await callback(this);
      console.log('[DB Transaction] Transaction committed');
      return result;
    } catch (error) {
      console.log('[DB Transaction] Transaction rolled back');
      throw error;
    }
  }

  async close(): Promise<void> {
    this.isConnected = false;
    console.log('[DB] Connection closed');
  }

  private generateId(): string {
    return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Database connection singleton
let dbConnection: DatabaseConnection | null = null;

export async function getDatabase(): Promise<DatabaseConnection> {
  if (!dbConnection) {
    // In production, this would create actual database connections
    // For now, using mock implementation
    const dbType = process.env.DATABASE_TYPE || 'mock';
    
    switch (dbType) {
      case 'postgresql':
        // dbConnection = new PostgreSQLConnection(process.env.DATABASE_URL);
        throw new Error('PostgreSQL connection not implemented yet');
      case 'mysql':
        // dbConnection = new MySQLConnection(process.env.DATABASE_URL);
        throw new Error('MySQL connection not implemented yet');
      case 'sqlite':
        // dbConnection = new SQLiteConnection(process.env.DATABASE_PATH);
        throw new Error('SQLite connection not implemented yet');
      default:
        console.log('[DB] Using mock database connection for development');
        dbConnection = new MockDatabaseConnection();
    }
  }
  
  return dbConnection;
}

// Migration management
export class MigrationManager {
  private db: DatabaseConnection;
  private migrationsPath: string;

  constructor(db: DatabaseConnection, migrationsPath?: string) {
    this.db = db;
    this.migrationsPath = migrationsPath || join(process.cwd(), 'lib', 'database', 'migrations');
  }

  async runMigrations(): Promise<void> {
    console.log('[Migration] Starting database migrations...');
    
    try {
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();
      
      // Get list of applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      
      // Get list of available migrations
      const availableMigrations = this.getAvailableMigrations();
      
      // Run pending migrations
      for (const migration of availableMigrations) {
        if (!appliedMigrations.includes(migration.name)) {
          await this.runMigration(migration);
        }
      }
      
      console.log('[Migration] All migrations completed successfully');
    } catch (error) {
      console.error('[Migration] Migration failed:', error);
      throw error;
    }
  }

  private async createMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    await this.db.execute(sql);
  }

  private async getAppliedMigrations(): Promise<string[]> {
    try {
      const results = await this.db.query<{ migration_name: string }>(
        'SELECT migration_name FROM schema_migrations ORDER BY applied_at'
      );
      return results.map(r => r.migration_name);
    } catch (error) {
      // If table doesn't exist, return empty array
      return [];
    }
  }

  private getAvailableMigrations(): Array<{ name: string; path: string }> {
    // In a real implementation, this would read migration files from the filesystem
    // For now, return the known migration
    return [
      {
        name: '001_paper_trading_schema',
        path: join(this.migrationsPath, '001_paper_trading_schema.sql')
      }
    ];
  }

  private async runMigration(migration: { name: string; path: string }): Promise<void> {
    console.log(`[Migration] Running migration: ${migration.name}`);
    
    try {
      // Read migration file
      const migrationSql = this.readMigrationFile(migration.path);
      
      // Execute migration in a transaction
      await this.db.transaction(async (db) => {
        // Split SQL into individual statements and execute them
        const statements = this.splitSqlStatements(migrationSql);
        
        for (const statement of statements) {
          if (statement.trim()) {
            await db.execute(statement);
          }
        }
        
        // Record migration as applied
        await db.execute(
          'INSERT INTO schema_migrations (migration_name) VALUES (?)',
          [migration.name]
        );
      });
      
      console.log(`[Migration] Successfully applied: ${migration.name}`);
    } catch (error) {
      console.error(`[Migration] Failed to apply ${migration.name}:`, error);
      throw error;
    }
  }

  private readMigrationFile(path: string): string {
    try {
      return readFileSync(path, 'utf-8');
    } catch (error) {
      // For mock implementation, return the schema directly
      console.log(`[Migration] Could not read file ${path}, using embedded schema`);
      return this.getEmbeddedSchema();
    }
  }

  private splitSqlStatements(sql: string): string[] {
    // Simple SQL statement splitter - in production, use a proper SQL parser
    return sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  }

  private getEmbeddedSchema(): string {
    // Embedded schema for cases where file system access is limited
    return `
      -- User qualifications tracking
      CREATE TABLE IF NOT EXISTS user_qualifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        is_qualified BOOLEAN DEFAULT FALSE,
        qualification_date TIMESTAMP,
        total_score INTEGER DEFAULT 0,
        simulations_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      );

      -- Module completion tracking
      CREATE TABLE IF NOT EXISTS qualification_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        module_id VARCHAR(255) NOT NULL,
        completion_date TIMESTAMP NOT NULL,
        score INTEGER NOT NULL,
        attempts INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, module_id)
      );

      -- Trading sessions
      CREATE TABLE IF NOT EXISTS trading_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active',
        trade_count INTEGER DEFAULT 0,
        win_count INTEGER DEFAULT 0,
        loss_count INTEGER DEFAULT 0,
        total_pnl DECIMAL(15,2) DEFAULT 0,
        win_rate DECIMAL(5,2) DEFAULT 0,
        average_win DECIMAL(15,2) DEFAULT 0,
        average_loss DECIMAL(15,2) DEFAULT 0,
        largest_win DECIMAL(15,2) DEFAULT 0,
        largest_loss DECIMAL(15,2) DEFAULT 0,
        average_hold_time INTEGER DEFAULT 0,
        total_volume BIGINT DEFAULT 0,
        unique_symbols TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Paper trades
      CREATE TABLE IF NOT EXISTS paper_trades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        session_id UUID NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        side VARCHAR(10) NOT NULL,
        quantity INTEGER NOT NULL,
        entry_price DECIMAL(15,4) NOT NULL,
        entry_time TIMESTAMP NOT NULL,
        exit_price DECIMAL(15,4),
        exit_time TIMESTAMP,
        status VARCHAR(20) DEFAULT 'open',
        order_type VARCHAR(20) DEFAULT 'market',
        limit_price DECIMAL(15,4),
        stop_loss DECIMAL(15,4),
        take_profit DECIMAL(15,4),
        pnl_amount DECIMAL(15,2),
        pnl_percentage DECIMAL(8,4),
        max_favorable_excursion DECIMAL(15,4) DEFAULT 0,
        max_adverse_excursion DECIMAL(15,4) DEFAULT 0,
        holding_period INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Trade analytics
      CREATE TABLE IF NOT EXISTS trade_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trade_id UUID NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        financial_metrics JSONB NOT NULL,
        timing_metrics JSONB NOT NULL,
        learning_scores JSONB NOT NULL,
        missed_opportunities JSONB DEFAULT '[]',
        behavioral_flags TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(trade_id)
      );

      -- Market data tick storage
      CREATE TABLE IF NOT EXISTS market_ticks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        symbol VARCHAR(20) NOT NULL,
        price DECIMAL(15,4) NOT NULL,
        volume BIGINT,
        bid DECIMAL(15,4),
        ask DECIMAL(15,4),
        spread DECIMAL(15,4),
        timestamp TIMESTAMP NOT NULL,
        source VARCHAR(50) DEFAULT 'unknown',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
  }
}

// Utility function to initialize database
export async function initializeDatabase(): Promise<DatabaseConnection> {
  const db = await getDatabase();
  const migrationManager = new MigrationManager(db);
  
  try {
    await migrationManager.runMigrations();
    console.log('[DB] Database initialized successfully');
    return db;
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    throw error;
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    const db = await getDatabase();
    await db.query('SELECT 1 as health_check');
    return { healthy: true, message: 'Database connection is healthy' };
  } catch (error) {
    return { 
      healthy: false, 
      message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Cleanup function
export async function closeDatabaseConnection(): Promise<void> {
  if (dbConnection) {
    await dbConnection.close();
    dbConnection = null;
  }
}