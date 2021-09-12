import winston, { format } from 'winston';
import WinstonDailyRotate from 'winston-daily-rotate-file';
import path from 'path';
import PathUtil from '@scripts/util/path.util';

export type TLogType = {
  type: string;
  data: any;
};

const logLevel = process.env.LOG_LEVEL || 'error';
const logPath = process.env.LOG_PATH
  ? path.resolve(process.env.LOG_PATH)
  : PathUtil.burdyRoot('logs');

const transportProps = {
  zippedArchiver: true,
  maxSize: process.env.LOG_SIZE || '20m',
  maxFiles: process.env.LOG_FILES || '14d',
};

const dailyRotateTransport = new WinstonDailyRotate({
  filename: path.join(`${logPath}`, 'burdy-%DATE%.log'),
  ...transportProps,
});

const errorRotateTransport = new WinstonDailyRotate({
  filename: path.join(`${logPath}`, 'burdy-error-%DATE%.log'),
  ...transportProps,
});

const logger = winston.createLogger({
  level: logLevel,
  format: format.combine(format.timestamp(), format.json()),
  transports: [dailyRotateTransport],
  exceptionHandlers: [errorRotateTransport],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: format.json(),
    })
  );
}

export default logger;
