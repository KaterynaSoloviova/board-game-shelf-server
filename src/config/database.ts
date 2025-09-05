// Database configuration and connection pool settings
export const databaseConfig = {
  // Connection pool settings
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '4'),
  poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '10000'), // 10 seconds
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'), // 60 seconds
  createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000'), // 30 seconds
  destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || '5000'), // 5 seconds
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // 30 seconds
  reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || '1000'), // 1 second
  createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL || '200'), // 200ms
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  min: parseInt(process.env.DB_MIN_CONNECTIONS || '2'),
  
  // Health check settings
  healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
  maxRetries: parseInt(process.env.DB_MAX_RETRIES || '5'),
  
  // Logging settings
  enableQueryLogging: process.env.NODE_ENV === 'development',
  logLevel: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
};

// Environment variable documentation
export const requiredEnvVars = [
  'DATABASE_URL',
] as const;

export const optionalEnvVars = [
  'DB_CONNECTION_LIMIT',
  'DB_POOL_TIMEOUT',
  'DB_ACQUIRE_TIMEOUT',
  'DB_CREATE_TIMEOUT',
  'DB_DESTROY_TIMEOUT',
  'DB_IDLE_TIMEOUT',
  'DB_REAP_INTERVAL',
  'DB_CREATE_RETRY_INTERVAL',
  'DB_MAX_CONNECTIONS',
  'DB_MIN_CONNECTIONS',
  'DB_HEALTH_CHECK_INTERVAL',
  'DB_MAX_RETRIES',
] as const;

// Validate required environment variables
export const validateDatabaseConfig = (): void => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
};

// Get database URL with connection pool parameters
export const getDatabaseUrl = (): string => {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // Add connection pool parameters to the URL if not already present
  const url = new URL(baseUrl);
  
  // Add connection pool parameters
  url.searchParams.set('connection_limit', databaseConfig.connectionLimit.toString());
  url.searchParams.set('pool_timeout', databaseConfig.poolTimeout.toString());
  url.searchParams.set('acquire_timeout', databaseConfig.acquireTimeoutMillis.toString());
  url.searchParams.set('create_timeout', databaseConfig.createTimeoutMillis.toString());
  url.searchParams.set('destroy_timeout', databaseConfig.destroyTimeoutMillis.toString());
  url.searchParams.set('idle_timeout', databaseConfig.idleTimeoutMillis.toString());
  url.searchParams.set('reap_interval', databaseConfig.reapIntervalMillis.toString());
  url.searchParams.set('create_retry_interval', databaseConfig.createRetryIntervalMillis.toString());
  url.searchParams.set('max', databaseConfig.max.toString());
  url.searchParams.set('min', databaseConfig.min.toString());
  
  return url.toString();
};
