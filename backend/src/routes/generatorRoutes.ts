import express from 'express';
import { compileSolidityTemplate } from '../controllers/generatorController';
// Potentially add authMiddleware if this route needs to be protected
// import { authMiddleware } from '../middlewares/authMiddleware'; 

const router = express.Router();

// Route for compiling Solidity templates
// If auth is needed: router.post('/compile-template', authMiddleware, compileSolidityTemplate);
router.post('/compile-template', compileSolidityTemplate);

export default router;
