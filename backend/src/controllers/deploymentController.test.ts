import request from 'supertest';
import express, { Express } from 'express';
import deploymentRoutes from '../routes/deploymentRoutes'; // Adjust if path is different
import Deployment from '../models/Deployment'; // To mock Deployment model
import { authMiddleware } from '../middlewares/authMiddleware'; // To mock auth middleware

// Mock dependencies
jest.mock('../models/Deployment');
jest.mock('../middlewares/authMiddleware', () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { _id: 'testUserId', email: 'test@example.com' }; // Mock authenticated user, ensure _id for controller
    next();
  }),
}));

const app: Express = express();
app.use(express.json());
app.use('/api/deployments', deploymentRoutes); // Mount deployment routes

describe('Deployment Controller (/api/deployments)', () => {
  const MockedDeployment = Deployment as jest.Mocked<typeof Deployment>;
  const mockDeploymentSave = jest.spyOn(Deployment.prototype, 'save');
  // const mockDeploymentConstructor = jest.fn(); // For `new Deployment()`
  // MockedDeployment.mockImplementation(mockDeploymentConstructor as any);


  beforeEach(() => {
    mockDeploymentSave.mockReset();
    // mockDeploymentConstructor.mockClear();
    MockedDeployment.find.mockReset(); // For getDeploymentsForUser
    (authMiddleware as jest.Mock).mockClear();
  });

  describe('POST /', () => {
    const newDeploymentData = {
      contractName: 'MyTestContract',
      blockchain: '80001', // Polygon Mumbai chainId
      network: 'Polygon Mumbai',
      contractAddress: '0x1234567890123456789012345678901234567890',
      transactionHash: '0xtxhash123', // Added as it's required by controller
      abi: [{ type: 'constructor' }],
    };

    it('should create a new deployment record successfully', async () => {
      mockDeploymentSave.mockResolvedValue({ 
        ...newDeploymentData, 
        userId: 'testUserId', // Controller sets this from req.user._id
        _id: 'deploymentId123',
        createdAt: new Date(),
      } as any);
      
      const response = await request(app)
        .post('/api/deployments/')
        .set('Authorization', 'Bearer testtoken') 
        .send(newDeploymentData);

      expect(authMiddleware).toHaveBeenCalled();
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id', 'deploymentId123');
      expect(response.body).toHaveProperty('userId', 'testUserId');
      expect(response.body.contractName).toBe(newDeploymentData.contractName);
      expect(mockDeploymentSave).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if required fields are missing', async () => {
      const { contractName, ...incompleteData } = newDeploymentData; 
      const response = await request(app)
        .post('/api/deployments/')
        .set('Authorization', 'Bearer testtoken')
        .send(incompleteData);

      expect(authMiddleware).toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Missing required deployment information/i); 
    });

    it('should return 500 if database save fails', async () => {
      mockDeploymentSave.mockRejectedValue(new Error('Database save error'));

      const response = await request(app)
        .post('/api/deployments/')
        .set('Authorization', 'Bearer testtoken')
        .send(newDeploymentData);
      
      expect(authMiddleware).toHaveBeenCalled();
      expect(response.status).toBe(500);
      // The controller sends a specific error message structure
      expect(response.body.message).toBe('Error saving deployment record');
      expect(response.body.error).toBe('Database save error');
    });
  });

  // Note: The actual routes for getting deployments in `deploymentRoutes.ts` is GET / (for user)
  // There is no /user/:userId endpoint in the provided `deploymentController.ts` or typical setup.
  // The controller's `getDeploymentsForUser` gets `userId` from `req.user._id`.
  // So, tests should reflect GET / route.
  describe('GET / (get deployments for authenticated user)', () => {
    it('should return deployments for the authenticated user', async () => {
      const mockUserDeployments = [
        { ...newDeploymentData, userId: 'testUserId', _id: 'dep1' },
        { ...newDeploymentData, contractName: 'AnotherContract', userId: 'testUserId', _id: 'dep2' },
      ];
      (MockedDeployment.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockUserDeployments) // Mock sort() as well
      } as any);


      const response = await request(app)
        .get('/api/deployments/') // No userId in URL, uses req.user._id
        .set('Authorization', 'Bearer testtoken'); 

      expect(authMiddleware).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserDeployments);
      expect(MockedDeployment.find).toHaveBeenCalledWith({ userId: 'testUserId' });
    });

    it('should return 500 if fetching deployments fails', async () => {
      (MockedDeployment.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      } as any);

      const response = await request(app)
        .get('/api/deployments/')
        .set('Authorization', 'Bearer testtoken');

      expect(authMiddleware).toHaveBeenCalled();
      expect(response.status).toBe(500);
      // The controller sends a specific error message structure
      expect(response.body.message).toBe('Error fetching deployment records');
      expect(response.body.error).toBe('Database error');
    });

    it('should return 401 if user is not authenticated (or user ID missing on req)', async () => {
        // Temporarily modify authMiddleware mock for this test
        (authMiddleware as jest.Mock).mockImplementationOnce((req, res, next) => {
            req.user = undefined; // Simulate no user or no _id
            next();
        });

        const response = await request(app)
            .get('/api/deployments/')
            .set('Authorization', 'Bearer testtoken'); // Token sent, but middleware mock clears user

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('User not authenticated or user ID missing.');
    });
  });
});
