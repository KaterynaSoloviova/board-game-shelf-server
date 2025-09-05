# Database Connection Pool Implementation

This document describes the enhanced database connection management system implemented for the Board Game Shelf Server.

## Overview

The database connection system has been upgraded to include:
- **Connection Pooling**: Efficient management of database connections
- **Health Monitoring**: Real-time database health checks
- **Retry Logic**: Automatic reconnection with exponential backoff
- **Graceful Shutdown**: Proper cleanup on application termination
- **Performance Metrics**: Detailed monitoring and analytics
- **Error Handling**: Robust error management and recovery

## Architecture

### Core Components

1. **Database Configuration** (`src/config/database.ts`)
   - Centralized configuration management
   - Environment variable validation
   - Connection pool settings

2. **Connection Manager** (`src/db/index.ts`)
   - Prisma client with connection pooling
   - Health monitoring and retry logic
   - Graceful shutdown handling

3. **Database Monitor** (`src/utils/databaseMonitor.ts`)
   - Performance metrics collection
   - Connection pool status monitoring
   - Query execution tracking

4. **Connection Middleware** (`src/middleware/databaseConnection.ts`)
   - Request-level connection validation
   - Automatic reconnection on failures

## Configuration

### Environment Variables

#### Required Variables
- `DATABASE_URL`: PostgreSQL connection string

#### Optional Variables (with defaults)
```bash
# Connection Pool Settings
DB_CONNECTION_LIMIT=10          # Maximum connections in pool
DB_POOL_TIMEOUT=10000           # Pool timeout in milliseconds
DB_ACQUIRE_TIMEOUT=60000        # Connection acquire timeout
DB_CREATE_TIMEOUT=30000         # Connection creation timeout
DB_DESTROY_TIMEOUT=5000         # Connection destruction timeout
DB_IDLE_TIMEOUT=30000           # Idle connection timeout
DB_REAP_INTERVAL=1000           # Connection cleanup interval
DB_CREATE_RETRY_INTERVAL=200    # Retry interval for connection creation
DB_MAX_CONNECTIONS=20           # Maximum total connections
DB_MIN_CONNECTIONS=2            # Minimum connections to maintain

# Health Monitoring
DB_HEALTH_CHECK_INTERVAL=30000  # Health check interval in milliseconds
DB_MAX_RETRIES=5                # Maximum connection retry attempts
```

### Connection Pool Benefits

1. **Performance**: Reuses existing connections instead of creating new ones
2. **Scalability**: Handles multiple concurrent requests efficiently
3. **Resource Management**: Prevents connection exhaustion
4. **Reliability**: Automatic reconnection and error recovery

## Usage

### Basic Usage

The database connection is automatically initialized when the application starts:

```typescript
import prisma from './db';

// Use prisma client as usual
const games = await prisma.game.findMany();
```

### Health Monitoring

Check database health and connection status:

```typescript
import { checkDatabaseHealth, getConnectionStatus } from './db';

const isHealthy = await checkDatabaseHealth();
const isConnected = getConnectionStatus();
```

### Performance Metrics

Access detailed performance metrics:

```typescript
import { 
  getDatabaseMetrics, 
  getConnectionPoolStatus, 
  getPerformanceMetrics 
} from './db';

const metrics = getDatabaseMetrics();
const poolStatus = await getConnectionPoolStatus();
const performance = await getPerformanceMetrics();
```

### Middleware Usage

Add connection validation to routes:

```typescript
import { ensureDatabaseConnection, requireHealthyDatabase } from './middleware/databaseConnection';

// Basic connection check
router.get('/games', ensureDatabaseConnection, async (req, res) => {
  // Route handler
});

// Strict health check for critical operations
router.post('/games', requireHealthyDatabase, async (req, res) => {
  // Critical route handler
});
```

## Health Endpoints

### `/health`

Comprehensive health check endpoint that returns:

```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "healthy": true,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "metrics": {
      "totalQueries": 150,
      "successfulQueries": 148,
      "failedQueries": 2,
      "successRate": 98.67,
      "averageQueryTime": 45.2,
      "uptime": 3600000
    },
    "connectionPool": {
      "active": 5,
      "max": 20,
      "poolSize": 20,
      "utilization": 25.0
    },
    "performance": {
      "database": "board_game_shelf",
      "connections": { "active": 5 },
      "transactions": {
        "committed": 1000,
        "rolledBack": 5,
        "total": 1005
      },
      "cache": {
        "hitRatio": 95.5,
        "blocksHit": 10000,
        "blocksRead": 500
      }
    }
  },
  "system": {
    "uptime": 3600,
    "memory": { "rss": 50000000, "heapTotal": 20000000 },
    "nodeVersion": "v18.17.0",
    "platform": "darwin"
  }
}
```

## Error Handling

### Connection Failures

The system automatically handles:
- **Connection timeouts**: Automatic retry with exponential backoff
- **Network issues**: Graceful degradation and reconnection
- **Database unavailability**: Proper error responses to clients

### Graceful Shutdown

The application properly handles:
- **SIGINT**: Graceful shutdown on Ctrl+C
- **SIGTERM**: Graceful shutdown on termination signals
- **Uncaught exceptions**: Cleanup and proper error reporting
- **Unhandled rejections**: Database disconnection before exit

## Monitoring and Alerting

### Metrics Tracked

1. **Query Performance**:
   - Total queries executed
   - Success/failure rates
   - Average query execution time

2. **Connection Pool**:
   - Active connections
   - Pool utilization
   - Connection creation/destruction rates

3. **Database Performance**:
   - Transaction rates
   - Cache hit ratios
   - Database operation counts

### Health Checks

- **Periodic checks**: Every 30 seconds (configurable)
- **On-demand checks**: Via `/health` endpoint
- **Automatic recovery**: Reconnection on failures

## Best Practices

### 1. Connection Management
- Always use the singleton Prisma client instance
- Don't create multiple Prisma client instances
- Use middleware for connection validation in critical routes

### 2. Error Handling
- Implement proper error handling in route handlers
- Use the health check endpoint for monitoring
- Monitor connection pool metrics regularly

### 3. Performance Optimization
- Adjust connection pool settings based on load
- Monitor query performance and optimize slow queries
- Use database indexes appropriately

### 4. Monitoring
- Set up alerts for connection failures
- Monitor memory usage and connection pool utilization
- Track query performance trends

## Troubleshooting

### Common Issues

1. **Connection Pool Exhaustion**
   - Increase `DB_MAX_CONNECTIONS`
   - Check for connection leaks
   - Optimize query performance

2. **High Query Times**
   - Check database indexes
   - Optimize complex queries
   - Monitor database performance

3. **Connection Failures**
   - Verify `DATABASE_URL` is correct
   - Check network connectivity
   - Review database server logs

### Debug Mode

Enable detailed logging by setting:
```bash
NODE_ENV=development
```

This will log all database queries and connection events.

## Migration from Previous Version

The new connection system is backward compatible. Existing code will continue to work without changes. The improvements are transparent to the application logic.

### Key Changes:
- Enhanced error handling and recovery
- Automatic connection pooling
- Health monitoring and metrics
- Graceful shutdown handling

No code changes are required for existing functionality.
