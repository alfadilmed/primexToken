import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3, // For HTTP request logging if desired later
  debug: 4,
};

// Determine log level based on environment (default to 'info')
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define colors for development console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(colors);

// Define different formats for development and production
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // If not in production, colorize and use simple format
  // Otherwise, use JSON format for production
  process.env.NODE_ENV !== 'production'
    ? winston.format.colorize({ all: true })
    : winston.format.json(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// In production, we want JSON logs, so the above printf might not be ideal.
// Let's refine the format for production vs development.

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // Log stack trace for errors
  winston.format.json()
);

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);


// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    // You can add file transports here if needed for production
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/all.log' }),
  ],
  exceptionHandlers: [ // Optional: Catch unhandled exceptions
    new winston.transports.Console(),
    // new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [ // Optional: Catch unhandled promise rejections
    new winston.transports.Console(),
    // new winston.transports.File({ filename: 'logs/rejections.log' })
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

export default logger;
