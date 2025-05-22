import express from 'express';
import { createDeploymentRecord, getDeploymentsForUser } from '../controllers/deploymentController'; // Corrected import
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, createDeploymentRecord);
router.get('/', protect, getDeploymentsForUser);

export default router;
