import request from 'supertest';
import express, { Express } from 'express';
import templateRoutes from '../routes/templateRoutes'; // Adjust path if tests are not in controllers dir
import Template from '../models/Template'; // To mock Template model methods
import logger from '../config/logger'; // Import logger

// Mock dependencies
jest.mock('../models/Template');
// jest.mock('../middlewares/authMiddleware', () => ({ // Assuming authMiddleware is used on POST
//   authMiddleware: (req, res, next) => next(), // Bypass auth for these tests
// }));

const app: Express = express();
app.use(express.json());
app.use('/api/templates', templateRoutes); // Mount the template routes

// Suppress logger output during tests to keep test console clean
// jest.spyOn(logger, 'info').mockImplementation(() => {});
// jest.spyOn(logger, 'warn').mockImplementation(() => {});
// jest.spyOn(logger, 'error').mockImplementation(() => {});


describe('Template Controller (/api/templates)', () => {
  const MockedTemplate = Template as jest.Mocked<typeof Template>;
  const mockTemplateFind = MockedTemplate.find as jest.Mock;
  const mockTemplateSave = jest.spyOn(MockedTemplate.prototype, 'save');
  // const mockTemplateConstructor = jest.fn();
  // MockedTemplate.mockImplementation(mockTemplateConstructor as any);


  beforeEach(() => {
    // Reset all mocks before each test
    mockTemplateFind.mockReset();
    mockTemplateSave.mockReset();
    // mockTemplateConstructor.mockClear();

    // Clear all logger mocks if they were set up
    // jest.clearAllMocks(); // This would clear all mocks, including Template, be careful
  });

  describe('GET /', () => {
    it('should return a list of templates successfully', async () => {
      const mockTemplates = [
        { _id: '1', name: 'ERC20', code: 'contract ERC20 {}' },
        { _id: '2', name: 'NFT', code: 'contract NFT {}' },
      ];
      mockTemplateFind.mockResolvedValue(mockTemplates as any); // Cast as any if lean() is used or type is complex

      const response = await request(app).get('/api/templates/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTemplates);
      expect(mockTemplateFind).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if fetching templates fails', async () => {
      mockTemplateFind.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/templates/');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error fetching templates');
      // Optionally check logger.error was called if not suppressing logs
    });
  });

  describe('POST /', () => {
    // Note: The createTemplate in controller might be admin-only.
    // If so, these tests would need to mock/bypass authMiddleware appropriately.
    // For now, assuming it's a general endpoint or auth is handled/mocked.
    
    const newTemplateData = {
      name: 'Voting Contract',
      description: 'A simple voting contract template',
      code: 'pragma solidity ^0.8.0; contract Voting {}',
      category: 'Governance',
      // ... other fields your Template model might have
    };

    it('should create a new template successfully', async () => {
      // Mock the constructor and save method
      // This is a bit tricky because 'new Template()' is called in the controller.
      // We need to mock the prototype's save method.
      mockTemplateSave.mockResolvedValue({ _id: '3', ...newTemplateData } as any);
      
      // If you need to assert what `new Template(req.body)` was called with,
      // you would need to mock the Template constructor itself.
      // For now, we focus on the save mock and the result.

      const response = await request(app)
        .post('/api/templates/')
        .send(newTemplateData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(newTemplateData.name);
      expect(mockTemplateSave).toHaveBeenCalledTimes(1);
      // expect(mockTemplateConstructor).toHaveBeenCalledWith(newTemplateData); // If constructor is mocked
    });

    it('should return 400 if template creation fails (e.g., validation error)', async () => {
      mockTemplateSave.mockRejectedValue(new Error('Validation failed'));

      const response = await request(app)
        .post('/api/templates/')
        .send(newTemplateData); // Assuming data that would cause validation error

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Error creating template');
    });
    
    it('should return 400 if required fields are missing for template creation', async () => {
        const incompleteData = { name: 'Incomplete Template' }; // Missing code, description, etc.
        // No need to mock save for this as validation should happen before model interaction in a real app
        // However, the current controller might pass it to `new Template()` which might error.
        // For a simple test, we can just check the status if the controller relies on Mongoose validation.
        
        // If your controller has specific pre-save validation:
        // const response = await request(app)
        //   .post('/api/templates/')
        //   .send(incompleteData);
        // expect(response.status).toBe(400);
        // expect(response.body.message).toContain("is required"); // Example message

        // If relying on Mongoose validation error during .save()
        mockTemplateSave.mockRejectedValue({ name: "ValidationError", message: "Template validation failed: name is required" });

        const response = await request(app)
          .post('/api/templates/')
          .send(incompleteData);
        
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Error creating template');
        // Optionally, if error details are passed back:
        // expect(response.body.error).toContain("Template validation failed");
    });
  });
});
