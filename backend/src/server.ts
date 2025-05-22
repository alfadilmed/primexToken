import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';

dotenv.config(); // Load environment variables from .env file

// Connect to MongoDB
connectDB();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import authRoutes from './routes/authRoutes';

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Backend is running' });
});

import userRoutes from './routes/userRoutes';

import templateRoutes from './routes/templateRoutes'; // Adjust path

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
