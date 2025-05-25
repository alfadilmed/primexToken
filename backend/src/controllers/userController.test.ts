import request from 'supertest';
import express, { Express } from 'express';
import userRoutes from '../routes/userRoutes'; // Assuming user routes are defined here
import User from '../models/User'; // To mock User model methods
import { authMiddleware } from '../middlewares/authMiddleware'; // To mock auth middleware

// Mock dependencies
jest.mock('../models/User');
jest.mock('../middlewares/authMiddleware', () => ({
  // Mock implementation of authMiddleware
  // It should call next() to allow the request to proceed to the controller
  // and attach a dummy user object to req.user if your controller expects it
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { _id: 'testUserId', email: 'test@example.com' }; // Attach a mock user object, ensure _id is used
    next();
  }),
}));


const app: Express = express();
app.use(express.json());
// Mount authMiddleware before userRoutes if all user routes are protected
// For the linkWalletAddress route, authMiddleware is applied directly in userRoutes.ts
app.use('/api/users', userRoutes);


describe('User Controller (/api/users)', () => {
  const MockedUser = User as jest.Mocked<typeof User>;
  // For static methods like findByIdAndUpdate, findOne
  // const mockUserFindByIdAndUpdate = MockedUser.findByIdAndUpdate as jest.Mock;
  // const mockUserFindOne = MockedUser.findOne as jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    // mockUserFindByIdAndUpdate.mockReset();
    // mockUserFindOne.mockReset();
    MockedUser.findByIdAndUpdate.mockReset();
    MockedUser.findOne.mockReset();
    (authMiddleware as jest.Mock).mockClear(); // Clear mock calls for authMiddleware
  });

  describe('GET /me (current user profile)', () => {
    it('should return the current user profile if authenticated', async () => {
        // authMiddleware mock already sets req.user
        const response = await request(app)
            .get('/api/users/me')
            .set('Authorization', 'Bearer testtoken');

        expect(authMiddleware).toHaveBeenCalled();
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ _id: 'testUserId', email: 'test@example.com' });
    });

    it('should return 401 if not authenticated (mock simulates this by not setting req.user if changed)', async () => {
        // To test this properly, we'd need to configure the authMiddleware mock to NOT call next() or not set req.user
        // For now, the current mock always authenticates. A more complex mock setup would be needed.
        // Or, if the route isn't protected by authMiddleware in the test setup for some reason.
        // Let's assume the middleware is always called for protected routes.
        // This test case might be more relevant in a setup where middleware can be conditionally applied/bypassed.
        // Given current mock, this case is hard to test directly without changing mock logic per test.
        // However, if the controller's getCurrentUser logic specifically checks `if (req.user)`
        // and authMiddleware somehow failed to set it (despite mock), then it would be 401.
        // Let's simulate the controller's internal check by temporarily modifying the mock for this one test.
        (authMiddleware as jest.Mock).mockImplementationOnce((req, res, next) => {
            req.user = undefined; // Simulate no user set by middleware
            next();
        });
        
        const response = await request(app)
            .get('/api/users/me')
            .set('Authorization', 'Bearer testtoken'); // Token is sent, but middleware mock clears user

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Not authorized, user data not found');
    });
  });

  describe('PUT /wallet (link wallet address)', () => { 
    // Route changed from /wallet/:userId to /wallet based on actual userRoutes.ts
    it('should link a wallet address to the authenticated user successfully', async () => {
      const updatedUserMock = {
        _id: 'testUserId',
        email: 'test@example.com',
        walletAddress: '0x123WalletAddress',
      };
      // Mock findByIdAndUpdate to return the updated user document
      MockedUser.findByIdAndUpdate.mockResolvedValue(updatedUserMock as any);

      const response = await request(app)
        .put('/api/users/wallet') // No userId in URL, uses req.user._id
        .set('Authorization', 'Bearer testtoken') 
        .send({ walletAddress: '0x123WalletAddress' });

      expect(authMiddleware).toHaveBeenCalled(); 
      expect(response.status).toBe(200);
      // Based on controller, it returns the updatedUser directly
      expect(response.body).toHaveProperty('walletAddress', '0x123WalletAddress');
      expect(MockedUser.findByIdAndUpdate).toHaveBeenCalledWith(
        'testUserId', // From mocked req.user._id
        { walletAddress: '0x123WalletAddress' },
        { new: true, runValidators: true }
      );
    });

    it('should return 400 if wallet address is missing', async () => {
      const response = await request(app)
        .put('/api/users/wallet')
        .set('Authorization', 'Bearer testtoken')
        .send({}); // Missing walletAddress

      expect(authMiddleware).toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Wallet address is required');
    });

    it('should return 400 if wallet address format is invalid', async () => {
      const response = await request(app)
        .put('/api/users/wallet')
        .set('Authorization', 'Bearer testtoken')
        .send({ walletAddress: 'invalid-wallet-address' });
      
      expect(authMiddleware).toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid wallet address format');
    });
    
    it('should return 400 if wallet address is already linked to another account', async () => {
        MockedUser.findOne.mockResolvedValue({ _id: 'anotherUserId', walletAddress: '0x123WalletAddress' } as any);

        const response = await request(app)
            .put('/api/users/wallet')
            .set('Authorization', 'Bearer testtoken') // req.user._id will be 'testUserId'
            .send({ walletAddress: '0x123WalletAddress' });

        expect(authMiddleware).toHaveBeenCalled();
        expect(MockedUser.findOne).toHaveBeenCalledWith({ walletAddress: '0x123WalletAddress' });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Wallet address already linked to another account');
    });


    it('should return 404 if user for token is not found during update', async () => {
      // This case means authMiddleware passed, but findByIdAndUpdate fails to find 'testUserId'
      MockedUser.findByIdAndUpdate.mockResolvedValue(null); 

      const response = await request(app)
        .put('/api/users/wallet')
        .set('Authorization', 'Bearer testtoken')
        .send({ walletAddress: '0xValidWalletAddress' });
      
      expect(authMiddleware).toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 500 if database update fails', async () => {
      MockedUser.findByIdAndUpdate.mockRejectedValue(new Error('Database update error'));

      const response = await request(app)
        .put('/api/users/wallet')
        .set('Authorization', 'Bearer testtoken')
        .send({ walletAddress: '0xNewWalletAddress' });
      
      expect(authMiddleware).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error while linking wallet address');
    });
  });
});
