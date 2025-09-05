import { Request, Response, NextFunction } from 'express';
import { getConnectionStatus, checkDatabaseHealth } from '../db';

// Middleware to check database connection before processing requests
export const ensureDatabaseConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if we have an active connection
    if (!getConnectionStatus()) {
      console.warn('⚠️ Database connection lost, attempting to reconnect...');
      
      // Try to reconnect
      const isHealthy = await checkDatabaseHealth();
      if (!isHealthy) {
        res.status(503).json({
          error: 'Database connection unavailable',
          message: 'The database is currently unavailable. Please try again later.',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Database connection middleware error:', error);
    res.status(503).json({
      error: 'Database connection error',
      message: 'Unable to establish database connection',
      timestamp: new Date().toISOString()
    });
  }
};

// Middleware for critical database operations that require a healthy connection
export const requireHealthyDatabase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isHealthy = await checkDatabaseHealth();
    
    if (!isHealthy) {
      res.status(503).json({
        error: 'Database unhealthy',
        message: 'The database is not responding properly. Please try again later.',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    res.status(503).json({
      error: 'Database health check failed',
      message: 'Unable to verify database health',
      timestamp: new Date().toISOString()
    });
  }
};
