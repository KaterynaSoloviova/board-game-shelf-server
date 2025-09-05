import { PrismaClient } from '../generated/prisma';
import { databaseConfig } from '../config/database';

// Database monitoring and metrics collection
export class DatabaseMonitor {
  private prisma: PrismaClient;
  private metrics: {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    averageQueryTime: number;
    connectionPoolSize: number;
    activeConnections: number;
    lastHealthCheck: Date | null;
    uptime: number;
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      connectionPoolSize: databaseConfig.max,
      activeConnections: 0,
      lastHealthCheck: null,
      uptime: Date.now(),
    };
  }

  // Get current database metrics
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime,
      successRate: this.metrics.totalQueries > 0 
        ? (this.metrics.successfulQueries / this.metrics.totalQueries) * 100 
        : 0,
    };
  }

  // Record query execution
  recordQuery(success: boolean, executionTime: number) {
    this.metrics.totalQueries++;
    
    if (success) {
      this.metrics.successfulQueries++;
    } else {
      this.metrics.failedQueries++;
    }

    // Update average query time
    const totalTime = this.metrics.averageQueryTime * (this.metrics.totalQueries - 1) + executionTime;
    this.metrics.averageQueryTime = totalTime / this.metrics.totalQueries;
  }

  // Update health check timestamp
  updateHealthCheck() {
    this.metrics.lastHealthCheck = new Date();
  }

  // Get connection pool status
  async getConnectionPoolStatus() {
    try {
      // This is a simplified version - in a real implementation,
      // you might want to use a connection pool library that provides these metrics
      const result = await this.prisma.$queryRaw`
        SELECT 
          count(*) as active_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
        FROM pg_stat_activity 
        WHERE state = 'active'
      ` as Array<{ active_connections: number; max_connections: number }>;

      return {
        active: result[0]?.active_connections || 0,
        max: result[0]?.max_connections || 0,
        poolSize: this.metrics.connectionPoolSize,
        utilization: result[0] ? (result[0].active_connections / result[0].max_connections) * 100 : 0,
      };
    } catch (error) {
      console.error('Failed to get connection pool status:', error);
      return {
        active: 0,
        max: 0,
        poolSize: this.metrics.connectionPoolSize,
        utilization: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get database performance metrics
  async getPerformanceMetrics() {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          datname as database_name,
          numbackends as active_connections,
          xact_commit as committed_transactions,
          xact_rollback as rolled_back_transactions,
          blks_read as blocks_read,
          blks_hit as blocks_hit,
          tup_returned as tuples_returned,
          tup_fetched as tuples_fetched,
          tup_inserted as tuples_inserted,
          tup_updated as tuples_updated,
          tup_deleted as tuples_deleted
        FROM pg_stat_database 
        WHERE datname = current_database()
      ` as Array<{
        database_name: string;
        active_connections: number;
        committed_transactions: number;
        rolled_back_transactions: number;
        blocks_read: number;
        blocks_hit: number;
        tuples_returned: number;
        tuples_fetched: number;
        tuples_inserted: number;
        tuples_updated: number;
        tuples_deleted: number;
      }>;

      const stats = result[0];
      if (!stats) {
        throw new Error('No database statistics available');
      }

      const hitRatio = stats.blocks_hit + stats.blocks_read > 0 
        ? (stats.blocks_hit / (stats.blocks_hit + stats.blocks_read)) * 100 
        : 0;

      return {
        database: stats.database_name,
        connections: {
          active: stats.active_connections,
        },
        transactions: {
          committed: stats.committed_transactions,
          rolledBack: stats.rolled_back_transactions,
          total: stats.committed_transactions + stats.rolled_back_transactions,
        },
        cache: {
          hitRatio: Math.round(hitRatio * 100) / 100,
          blocksHit: stats.blocks_hit,
          blocksRead: stats.blocks_read,
        },
        operations: {
          returned: stats.tuples_returned,
          fetched: stats.tuples_fetched,
          inserted: stats.tuples_inserted,
          updated: stats.tuples_updated,
          deleted: stats.tuples_deleted,
        },
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      connectionPoolSize: databaseConfig.max,
      activeConnections: 0,
      lastHealthCheck: null,
      uptime: Date.now(),
    };
  }
}

// Create a singleton instance
let monitorInstance: DatabaseMonitor | null = null;

export const getDatabaseMonitor = (prisma: PrismaClient): DatabaseMonitor => {
  if (!monitorInstance) {
    monitorInstance = new DatabaseMonitor(prisma);
  }
  return monitorInstance;
};
