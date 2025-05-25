import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import logger from '../config/logger'; // Added logger import

const generateToken = (id: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    logger.error('JWT_SECRET is not defined in .env file. Authentication cannot proceed. Application will exit.');
    process.exit(1);
  }
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: '30d',
  });
};

export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
    });

    // Select user fields to return, explicitly excluding password
    const userResponse = {
        _id: user._id,
        email: user.email,
        createdAt: user.createdAt,
    };

    res.status(201).json({
      ...userResponse,
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    logger.error('Error in registerUser', { 
      message: error.message, 
      stack: error.stack, 
      requestBody: req.body // Be cautious with logging sensitive data from req.body
    });
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email }).select('+password'); // Explicitly select password

    if (!user || !user.password) { // Check if user exists and password field is present
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Select user fields to return, explicitly excluding password
    const userResponse = {
        _id: user._id,
        email: user.email,
        createdAt: user.createdAt,
    };

    res.status(200).json({
      ...userResponse,
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    logger.error('Error in loginUser', {
      message: error.message,
      stack: error.stack,
      requestBody: { email: req.body.email } // Log only email for login attempts
    });
    res.status(500).json({ message: 'Server error' });
  }
};
