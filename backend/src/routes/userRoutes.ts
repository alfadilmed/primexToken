import express from 'express';
import { getCurrentUser, linkWalletAddress } from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/me', protect, getCurrentUser);
router.put('/me/wallet', protect, linkWalletAddress);

export default router;
