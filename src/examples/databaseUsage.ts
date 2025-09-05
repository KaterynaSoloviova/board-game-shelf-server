// Example usage of the enhanced database connection system

import prisma from '../db';
import { 
  checkDatabaseHealth, 
  getConnectionStatus, 
  getDatabaseMetrics,
  getConnectionPoolStatus,
  getPerformanceMetrics 
} from '../db';
import { ensureDatabaseConnection, requireHealthyDatabase } from '../middleware/databaseConnection';

// Example 1: Basic database operations (no changes needed)
export const basicDatabaseOperations = async () => {
  try {
    // These operations work exactly as before
    const games = await prisma.game.findMany({
      include: {
        tags: true,
        sessions: true,
        wishlist: true
      }
    });

    const newGame = await prisma.game.create({
      data: {
        title: 'Example Game',
        description: 'A great board game',
        genre: 'Strategy',
        minPlayers: 2,
        maxPlayers: 4,
        playTime: 60,
        publisher: 'Example Publisher',
        age: '12+',
        rating: 8.5,
        coverImage: 'https://example.com/image.jpg',
        isOwned: true
      }
    });

    return { games, newGame };
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  }
};

// Example 2: Health monitoring
export const healthMonitoringExample = async () => {
  try {
    // Check if database is healthy
    const isHealthy = await checkDatabaseHealth();
    console.log('Database healthy:', isHealthy);

    // Check connection status
    const isConnected = getConnectionStatus();
    console.log('Database connected:', isConnected);

    // Get performance metrics
    const metrics = getDatabaseMetrics();
    console.log('Database metrics:', metrics);

    // Get connection pool status
    const poolStatus = await getConnectionPoolStatus();
    console.log('Connection pool status:', poolStatus);

    // Get detailed performance metrics
    const performance = await getPerformanceMetrics();
    console.log('Performance metrics:', performance);

    return {
      isHealthy,
      isConnected,
      metrics,
      poolStatus,
      performance
    };
  } catch (error) {
    console.error('Health monitoring failed:', error);
    throw error;
  }
};

// Example 3: Using middleware in Express routes
import express from 'express';
const router = express.Router();

// Basic connection check - will attempt reconnection if needed
router.get('/games', ensureDatabaseConnection, async (req, res) => {
  try {
    const games = await prisma.game.findMany();
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Strict health check - requires healthy database
router.post('/games', requireHealthyDatabase, async (req, res) => {
  try {
    const game = await prisma.game.create({
      data: req.body
    });
    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Example 4: Error handling with automatic retry
export const robustDatabaseOperation = async () => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Check database health before operation
      const isHealthy = await checkDatabaseHealth();
      if (!isHealthy) {
        throw new Error('Database is not healthy');
      }

      // Perform the operation
      const result = await prisma.game.findMany({
        where: { isOwned: true },
        include: { tags: true }
      });

      return result;
    } catch (error) {
      attempt++;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt >= maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} attempts`);
      }

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Example 5: Transaction with connection validation
export const transactionWithValidation = async (gameData: any, playerData: any[]) => {
  try {
    // Ensure database is healthy before starting transaction
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      throw new Error('Database is not healthy, cannot start transaction');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create game
      const game = await tx.game.create({
        data: gameData
      });

      // Create players and connect them
      const players = await Promise.all(
        playerData.map(player => 
          tx.player.upsert({
            where: { name: player.name },
            update: {},
            create: { name: player.name }
          })
        )
      );

      // Create session with players
      const session = await tx.session.create({
        data: {
          date: new Date(),
          gameId: game.id,
          players: {
            connect: players.map(p => ({ id: p.id }))
          }
        }
      });

      return { game, players, session };
    });

    return result;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};

// Example 6: Monitoring and alerting
export const setupMonitoring = () => {
  // Set up periodic health checks
  setInterval(async () => {
    try {
      const isHealthy = await checkDatabaseHealth();
      if (!isHealthy) {
        console.warn('⚠️ Database health check failed');
        // Here you could send alerts to monitoring services
      }
    } catch (error) {
      console.error('❌ Health check error:', error);
    }
  }, 30000); // Check every 30 seconds

  // Set up metrics collection
  setInterval(async () => {
    try {
      const metrics = getDatabaseMetrics();
      const poolStatus = await getConnectionPoolStatus();
      
      console.log('📊 Database Metrics:', {
        queries: metrics.totalQueries,
        successRate: metrics.successRate,
        avgQueryTime: metrics.averageQueryTime,
        poolUtilization: poolStatus.utilization
      });

      // Alert if success rate is too low
      if (metrics.successRate < 95) {
        console.warn('⚠️ Low database success rate:', metrics.successRate);
      }

      // Alert if pool utilization is too high
      if (poolStatus.utilization > 80) {
        console.warn('⚠️ High connection pool utilization:', poolStatus.utilization);
      }
    } catch (error) {
      console.error('❌ Metrics collection error:', error);
    }
  }, 60000); // Collect metrics every minute
};

export default router;
