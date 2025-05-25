import mongoose from 'mongoose';
import logger from './logger'; // Assuming logger.ts is in the same config directory

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    logger.error('MONGO_URI is not defined in .env file. Application will exit.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected successfully.');
  } catch (err: any) { // Explicitly type err as any or a more specific error type
    // Log the full error object for more details, including stack trace if available
    // The logger's format (especially prodFormat with errors({ stack: true })) should handle this.
    logger.error('MongoDB connection error. Application will exit.', { 
      message: err.message, 
      stack: err.stack, 
      // You might want to include other properties of the error if they are relevant
      // e.g., name: err.name, code: err.code 
    });
    process.exit(1);
  }
};

export default connectDB;
