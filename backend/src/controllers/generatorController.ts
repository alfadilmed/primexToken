import { Request, Response } from 'express';
import { GeneratorService, PlaceholderValues } from '../services/generatorService';
import logger from '../config/logger'; // Added logger import

const generatorService = new GeneratorService();

/**
 * Controller function to handle requests for Solidity template compilation.
 * It validates the request body, calls the GeneratorService to perform
 * placeholder replacement and compilation, and returns the ABI and bytecode
 * or an appropriate error response.
 * @param req Express Request object. Expected body:
 *   {
 *     templateString: string, // Raw Solidity code with placeholders
 *     placeholderValues: Record<string, string | number>, // Values for placeholders
 *     contractName: string // Name of the contract to compile from the templateString
 *   }
 * @param res Express Response object.
 */
export const compileSolidityTemplate = async (req: Request, res: Response) => {
  const { templateString, placeholderValues, contractName } = req.body;

  // Basic Validation
  if (!templateString || typeof templateString !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid field: templateString (must be a non-empty string).' });
  }
  if (!placeholderValues || typeof placeholderValues !== 'object' || Array.isArray(placeholderValues)) {
    return res.status(400).json({ message: 'Missing or invalid field: placeholderValues (must be an object).' });
  }
  if (!contractName || typeof contractName !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid field: contractName (must be a non-empty string).' });
  }

  try {
    const result = await generatorService.compile(
      templateString,
      placeholderValues as PlaceholderValues,
      contractName
    );
    res.status(200).json({ abi: result.abi, bytecode: result.bytecode });
  } catch (error: any) {
    // Log the error with more context, being mindful of sensitive data in req.body in production
    logger.error('Error during Solidity compilation request', { 
      message: error.message, 
      stack: error.stack, 
      // Consider redacting or selectively logging parts of req.body if it contains sensitive info
      requestBody: req.body 
    });

    // Check for specific error messages from GeneratorService
    if (error.message && 
        (error.message.startsWith('Solidity compilation failed:') || 
         error.message.includes('not found in compiled output') ||
         error.message.includes('Contract with name') )) {
      return res.status(400).json({
        message: 'Compilation process failed.',
        details: error.message, 
      });
    }
    
    // Generic server error for other unexpected issues
    res.status(500).json({ message: 'An internal server error occurred during compilation.' });
  }
};
