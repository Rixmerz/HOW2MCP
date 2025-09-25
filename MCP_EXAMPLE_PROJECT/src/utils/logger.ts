/**
 * Logger utility for MCP servers
 * 
 * Provides structured logging that doesn't interfere with stdio communication
 */

export class Logger {
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = 'info') {
    this.logLevel = logLevel;
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog('error')) {
      this.writeLog('error', message, meta);
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      this.writeLog('warn', message, meta);
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      this.writeLog('info', message, meta);
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      this.writeLog('debug', message, meta);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    return levels[level] <= levels[this.logLevel];
  }

  private writeLog(level: LogLevel, message: string, meta?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta }),
    };

    // Always log to stderr to avoid interfering with stdio communication
    console.error(JSON.stringify(logEntry));
  }
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
