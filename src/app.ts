//Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
import dotenv from "dotenv";
dotenv.config();

//Connects to the database with connection pooling
import "./db";
import { 
  checkDatabaseHealth, 
  getConnectionStatus, 
  getDatabaseMetrics, 
  getConnectionPoolStatus, 
  getPerformanceMetrics 
} from "./db";

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
import express, { Application } from "express";

const app: Application = express();

//This function is getting exported from the config folder. It runs most pieces of middleware
import config from "./config/index";
config(app);

//Start handling routes here
import indexRoutes from "./routes/index.routes";
app.use("/api", indexRoutes);


// Add health check endpoint for database connection
app.get("/health", async (req, res) => {
    try {
      const isHealthy = await checkDatabaseHealth();
      const connectionStatus = getConnectionStatus();
      const metrics = getDatabaseMetrics();
      const poolStatus = await getConnectionPoolStatus();
      const performanceMetrics = await getPerformanceMetrics();
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        database: {
          connected: connectionStatus,
          healthy: isHealthy,
          timestamp: new Date().toISOString(),
          metrics: {
            totalQueries: metrics.totalQueries,
            successfulQueries: metrics.successfulQueries,
            failedQueries: metrics.failedQueries,
            successRate: metrics.successRate,
            averageQueryTime: metrics.averageQueryTime,
            uptime: metrics.uptime
          },
          connectionPool: poolStatus,
          performance: performanceMetrics
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        database: {
          connected: false,
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage()
        }
      });
    }
  });

  
//To handle errors. Routes that don't exist or errors that you handle in specific routes
import errorHandling from "./error-handling/index";
errorHandling(app);

export default app;
