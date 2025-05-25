import request from 'supertest';
import express, { Express } from 'express';
import authRoutes from '../routes/authRoutes'; // Using authRoutes to test controller via HTTP calls
import User from '../models/User'; // To mock User model methods
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const app: Express = express();
app.use(express.json());
app.use('/api/auth', authRoutes); // Mount the auth routes

describe('Auth Controller (/api/auth)', () => {
  // Typed mocks
  const MockedUser = User as jest.Mocked<typeof User>;
  const mockBcryptCompare = bcrypt.compare as jest.Mock;
  const mockJwtSign = jwt.sign as jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    MockedUser.findOne.mockReset();
    MockedUser.create.mockReset();
    mockBcryptCompare.mockReset();
    mockJwtSign.mockReset();
  });

  describe('POST /register', () => {
    it('should register a new user successfully and return a token', async () => {
      MockedUser.findOne.mockResolvedValue(null); // No existing user
      (MockedUser.create as jest.Mock).mockResolvedValue({ // Type assertion for the mock
        _id: 'someUserId',
        email: 'test@example.com',
        // other fields if your controller uses them after create
      });
      mockJwtSign.mockReturnValue('testToken123');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'TestUser', // Assuming username is part of registration
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token', 'testToken123');
      expect(MockedUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(MockedUser.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com',
        username: 'TestUser', 
        // password will be hashed, so not directly checking it here unless hash is predictable
      }));
      expect(jwt.sign).toHaveBeenCalled();
    });

    it('should return 400 if email already exists', async () => {
      MockedUser.findOne.mockResolvedValue({ email: 'test@example.com' }); // User exists

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'TestUser',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already exists with this email');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' }); // Missing username and password

      expect(response.status).toBe(400);
      // Add more specific message checks based on your controller's validation
      expect(response.body.message).toMatch(/required/i); 
    });
  });

  describe('POST /login', () => {
    it('should login an existing user and return a token', async () => {
      const mockUser = {
        _id: 'someUserId',
        email: 'test@example.com',
        password: 'hashedPassword123', // DB stores hashed password
      };
      MockedUser.findOne.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true); // Password matches
      mockJwtSign.mockReturnValue('testLoginToken123');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', 'testLoginToken123');
      expect(MockedUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(jwt.sign).toHaveBeenCalled();
    });

    it('should return 400 if user is not found', async () => {
      MockedUser.findOne.mockResolvedValue(null); // No user

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 if password does not match', async () => {
      const mockUser = {
        _id: 'someUserId',
        email: 'test@example.com',
        password: 'hashedPassword123',
      };
      MockedUser.findOne.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false); // Password does not match

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid credentials');
    });
     it('should return 400 on login if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' }); // Missing password

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/required/i); 
    });
  });
});
