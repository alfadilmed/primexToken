import request from 'supertest';
import express, { Express } from 'express';
import generatorRoutes from './generatorRoutes'; // Adjust path if your test file is elsewhere
import { GeneratorService } from '../services/generatorService'; // To mock its methods

// Mock the GeneratorService
jest.mock('../services/generatorService');

const app: Express = express();
app.use(express.json()); // Important to parse JSON request bodies
app.use('/api/generator', generatorRoutes); // Mount the routes to be tested

describe('POST /api/generator/compile-template', () => {
  let mockCompile: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks and provide a default implementation for each test if needed
    // Or, mock specific implementations per test case
    mockCompile = jest.spyOn(GeneratorService.prototype, 'compile');
  });

  afterEach(() => {
    mockCompile.mockRestore(); // Restore original implementation
  });

  const validRequestBody = {
    templateString: "pragma solidity ^0.8.0; contract TestContract { function greet() public pure returns (string memory) { return "Hello"; } }",
    placeholderValues: {},
    contractName: "TestContract",
  };

  it('should return 200 OK with ABI and bytecode on successful compilation', async () => {
    const mockAbi = [{ type: 'function', name: 'greet' }];
    const mockBytecode = '0x123abc';
    mockCompile.mockResolvedValue({ abi: mockAbi, bytecode: mockBytecode });

    const response = await request(app)
      .post('/api/generator/compile-template')
      .send(validRequestBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ abi: mockAbi, bytecode: mockBytecode });
    expect(mockCompile).toHaveBeenCalledWith(
      validRequestBody.templateString,
      validRequestBody.placeholderValues,
      validRequestBody.contractName
    );
  });

  it('should return 400 if templateString is missing', async () => {
    const { templateString, ...badRequest } = validRequestBody;
    const response = await request(app)
      .post('/api/generator/compile-template')
      .send(badRequest);
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Missing or invalid field: templateString');
  });

  it('should return 400 if placeholderValues is missing', async () => {
    const { placeholderValues, ...badRequest } = validRequestBody;
    const response = await request(app)
      .post('/api/generator/compile-template')
      .send(badRequest);
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Missing or invalid field: placeholderValues');
  });
  
  it('should return 400 if placeholderValues is not an object', async () => {
    const badRequest = {...validRequestBody, placeholderValues: "not-an-object"};
    const response = await request(app)
      .post('/api/generator/compile-template')
      .send(badRequest);
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Missing or invalid field: placeholderValues (must be an object)');
  });

  it('should return 400 if contractName is missing', async () => {
    const { contractName, ...badRequest } = validRequestBody;
    const response = await request(app)
      .post('/api/generator/compile-template')
      .send(badRequest);
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Missing or invalid field: contractName');
  });

  it('should return 400 if compilation fails (e.g. Solidity error)', async () => {
    const errorMessage = 'Solidity compilation failed:\nSyntax Error';
    mockCompile.mockRejectedValue(new Error(errorMessage));

    const response = await request(app)
      .post('/api/generator/compile-template')
      .send(validRequestBody);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Compilation process failed.');
    expect(response.body.details).toBe(errorMessage);
  });
  
  it('should return 400 if contract name not found in output', async () => {
    const errorMessage = "Contract with name 'WrongName' not found in compiled output.";
    mockCompile.mockRejectedValue(new Error(errorMessage));

    const response = await request(app)
      .post('/api/generator/compile-template')
      .send(validRequestBody);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Compilation process failed.');
    expect(response.body.details).toBe(errorMessage);
  });

  it('should return 500 if an unexpected error occurs in the service', async () => {
    mockCompile.mockRejectedValue(new Error('Unexpected service error')); // Generic error not matching specific checks

    const response = await request(app)
      .post('/api/generator/compile-template')
      .send(validRequestBody);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('An internal server error occurred during compilation.');
  });
});
