/* eslint-disable no-console */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private prefix: string;

  constructor(prefix = '') {
    this.prefix = prefix ? `[${prefix}]` : '';
  }

  private formatMessage(level: LogLevel, message: string) {
    const timestamp = new Date().toISOString();
    return `${timestamp} ${level.toUpperCase()} ${this.prefix} ${message}`;
  }

  info(message: string, ...args: unknown[]) {
    console.log(this.formatMessage('info', message), ...args);
  }

  warn(message: string, ...args: unknown[]) {
    console.warn(this.formatMessage('warn', message), ...args);
  }

  error(message: string, ...args: unknown[]) {
    console.error(this.formatMessage('error', message), ...args);
  }

  debug(message: string, ...args: unknown[]) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }
}

export const createLogger = (prefix: string) => new Logger(prefix);
export const logger = new Logger();
export default logger;
