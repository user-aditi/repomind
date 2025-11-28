import { logger } from './logger';
import { db } from './db';

export interface ErrorLog {
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
}

export class LocalErrorTracker {
  static async logError(error: Error, context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      context,
    };
    
    // Log to console/file
    logger.error(errorLog, 'Application error');
    
    // Optional: Store in database for dashboard viewing
    try {
      await db.$executeRaw`
        INSERT INTO error_logs (timestamp, level, message, stack, context)
        VALUES (${errorLog.timestamp}, ${errorLog.level}, ${errorLog.message}, 
                ${errorLog.stack}, ${JSON.stringify(errorLog.context)})
      `;
    } catch (dbError) {
      logger.error({ dbError }, 'Failed to log error to database');
    }
  }
  
  static async getRecentErrors(limit = 50) {
    return db.$queryRaw`
      SELECT * FROM error_logs 
      ORDER BY timestamp DESC 
      LIMIT ${limit}
    `;
  }
}

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    LocalErrorTracker.logError(event.error, {
      source: 'window.onerror',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    LocalErrorTracker.logError(
      new Error(event.reason?.message || 'Unhandled Promise Rejection'),
      { source: 'unhandledrejection', reason: event.reason }
    );
  });
}
