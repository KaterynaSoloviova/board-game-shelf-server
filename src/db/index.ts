import { PrismaClient } from '../generated/prisma';
import { databaseConfig, validateDatabaseConfig, getDatabaseUrl } from '../config/database';
import { getDatabaseMonitor } from '../utils/databaseMonitor';

// Validate database configuration on startup
validateDatabaseConfig();

// Enhanced Prisma client with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  // Connection pool configuration
  log: databaseConfig.logLevel as any,
  errorFormat: 'pretty',
});

// Connection health monitoring
let isConnected = false;
let connectionRetries = 0;
const maxRetries = databaseConfig.maxRetries;

// Initialize database monitor
const monitor = getDatabaseMonitor(prisma);

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    connectionRetries = 0;
    monitor.updateHealthCheck();
    monitor.recordQuery(true, Date.now() - startTime);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    isConnected = false;
    monitor.recordQuery(false, Date.now() - startTime);
    return false;
  }
};

// Connection retry logic
export const connectWithRetry = async (): Promise<void> => {
  while (connectionRetries < maxRetries) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      isConnected = true;
      connectionRetries = 0;
      return;
    } catch (error) {
      connectionRetries++;
      console.error(`❌ Database connection attempt ${connectionRetries} failed:`, error);
      
      if (connectionRetries >= maxRetries) {
        console.error('❌ Max connection retries reached. Database connection failed.');
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, connectionRetries) * 1000;
      console.log(`⏳ Retrying connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Disconnecting from database...');
    await prisma.$disconnect();
    isConnected = false;
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
    throw error;
  }
};

// Connection status getter
export const getConnectionStatus = (): boolean => isConnected;

// Database monitoring exports
export const getDatabaseMetrics = () => monitor.getMetrics();
export const getConnectionPoolStatus = () => monitor.getConnectionPoolStatus();
export const getPerformanceMetrics = () => monitor.getPerformanceMetrics();
export const resetDatabaseMetrics = () => monitor.resetMetrics();

// Initialize connection
const initializeConnection = async (): Promise<void> => {
  try {
    await connectWithRetry();
    
    // Set up periodic health checks
    setInterval(async () => {
      await checkDatabaseHealth();
    }, databaseConfig.healthCheckInterval);
    
  } catch (error) {
    console.error('❌ Failed to initialize database connection:', error);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🔄 Received SIGINT. Gracefully shutting down...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Received SIGTERM. Gracefully shutting down...');
  await disconnectDatabase();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await disconnectDatabase();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  await disconnectDatabase();
  process.exit(1);
});

// Initialize connection on module load
initializeConnection();

export default prisma;

