import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import logger from './config/logger'; // Added logger import

dotenv.config(); // Load environment variables from .env file

// Connect to MongoDB
connectDB();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import healthRoutes from './routes/healthRoutes'; // Added health routes
import authRoutes from './routes/authRoutes';

// Basic route for testing
// app.get('/api/health', (req, res) => { // Will be replaced by healthRoutes
//   res.status(200).json({ status: 'UP', message: 'Backend is running' });
// });

import userRoutes from './routes/userRoutes';

import templateRoutes from './routes/templateRoutes'; // Adjust path

import deploymentRoutes from './routes/deploymentRoutes'; // Adjust path
import generatorRoutes from './routes/generatorRoutes'; // Added for generator

// API routes
app.use('/health', healthRoutes); // Added health route
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/generator', generatorRoutes); // Added for generator

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
