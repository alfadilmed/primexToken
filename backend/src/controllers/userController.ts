import { Request, Response } from 'express';
import User, { IUser } from '../models/User';

export const getCurrentUser = async (req: Request, res: Response) => {
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: 'Not authorized, user data not found' });
  }
};

export const linkWalletAddress = async (req: Request, res: Response) => {
  const { walletAddress } = req.body;
  const userId = req.user?._id; // User ID from protect middleware

  if (!walletAddress) {
    return res.status(400).json({ message: 'Wallet address is required' });
  }

  // Basic validation for Ethereum address
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).json({ message: 'Invalid wallet address format' });
  }

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized, user ID not found' });
  }

  try {
    // Check if this wallet address is already linked to another user
    const existingUserWithWallet = await User.findOne({ walletAddress });
    if (existingUserWithWallet && existingUserWithWallet._id.toString() !== userId.toString()) {
        return res.status(400).json({ message: 'Wallet address already linked to another account' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { walletAddress },
      { new: true, runValidators: true } // Return updated document, run schema validators
    ).select('-password'); // Exclude password from the returned object

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error('Error linking wallet address:', error);
    // Handle potential duplicate key error for walletAddress if not handled by the above check
    if (error.code === 11000 && error.keyPattern && error.keyPattern.walletAddress) {
        return res.status(400).json({ message: 'This wallet address is already in use.' });
    }
    res.status(500).json({ message: 'Server error while linking wallet address' });
  }
};
