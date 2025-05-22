import express from 'express';
import { getAllTemplates, createTemplate } from '../controllers/templateController';
// import { protect, admin } from '../middlewares/authMiddleware'; // Assuming admin middleware for POST later

const router = express.Router();

router.get('/', getAllTemplates);
// For now, createTemplate can be unprotected for easy seeding.
// Later, it should be protected: router.post('/', protect, admin, createTemplate);
router.post('/', createTemplate); 

export default router;
