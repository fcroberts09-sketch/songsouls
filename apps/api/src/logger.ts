import pino from 'pino';
import type { Config } from './config.js';

/** Structured JSON logs always; pretty only when a developer asks for it. */
export function createLogger(config: Pick<Config, 'LOG_LEVEL' | 'NODE_ENV'>) {
  const pretty = config.NODE_ENV === 'development' && process.stdout.isTTY;
  return pino({
    level: config.LOG_LEVEL,
    base: { service: 'parity-api' },
    redact: ['req.headers.authorization', 'req.headers.cookie', '*.email', '*.password'],
    ...(pretty ? { transport: { target: 'pino-pretty', options: { colorize: true } } } : {}),
  });
}
export type Logger = ReturnType<typeof createLogger>;
