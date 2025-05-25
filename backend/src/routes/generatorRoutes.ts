import express from 'express';
import { compileSolidityTemplate } from '../controllers/generatorController';
// Uncomment if auth is needed in the future
// import { authMiddleware } from '../middlewares/authMiddleware'; 

const router = express.Router();

/**
 * @swagger
 * /api/generator/compile-template:
 *   post:
 *     summary: Compiles a Solidity template with provided placeholder values.
 *     description: >
 *       Takes a Solidity template string, an object of placeholder values, 
 *       and the name of the contract to compile. Returns the ABI and bytecode 
 *       of the compiled contract.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateString
 *               - placeholderValues
 *               - contractName
 *             properties:
 *               templateString:
 *                 type: string
 *                 description: The raw Solidity code template with placeholders (e.g., %%NAME%%).
 *                 example: "pragma solidity ^0.8.0; contract MyToken { string public name = "%%TOKEN_NAME%%"; }"
 *               placeholderValues:
 *                 type: object
 *                 additionalProperties:
 *                   type: [string, number]
 *                 description: Key-value pairs for placeholder replacement. Keys are the placeholders.
 *                 example: { "%%TOKEN_NAME%%": "My Awesome Token" }
 *               contractName:
 *                 type: string
 *                 description: The name of the contract within the templateString to be compiled.
 *                 example: "MyToken"
 *     responses:
 *       '200':
 *         description: Successful compilation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 abi:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: The Application Binary Interface (ABI) of the compiled contract.
 *                 bytecode:
 *                   type: string
 *                   description: The bytecode of the compiled contract, prefixed with '0x'.
 *       '400':
 *         description: Bad request due to missing input, invalid input, or compilation errors.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 details:
 *                   type: string
 *                   description: Detailed error message, especially for compilation failures.
 *       '500':
 *         description: Internal server error.
 */
// If authentication is to be added later, the line would be:
// router.post('/compile-template', authMiddleware, compileSolidityTemplate);
router.post('/compile-template', compileSolidityTemplate);

export default router;
