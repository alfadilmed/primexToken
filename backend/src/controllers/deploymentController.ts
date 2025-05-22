import Deployment from '../models/Deployment'; // Adjust path as necessary
import { Request, Response } from 'express';

// Assuming IUser is available on req.user via authMiddleware
// interface AuthenticatedRequest extends Request { user?: { _id: string; /* other user props */ }; } // _id usually from Mongoose

export const createDeploymentRecord = async (req: Request, res: Response) => {
  // Cast req to AuthenticatedRequest if you have such an interface
  const authenticatedReq = req as any; // Basic cast for simplicity here
  
  try {
    const {
      projectId, // Optional, if you integrate project selection later
      contractName,
      blockchain, // This would be the network name/ID from frontend
      network, // Could be more specific like 'Mumbai Testnet'
      contractAddress,
      transactionHash,
      abi, // Store ABI for future interaction? Can be large.
      // bytecode, // Usually not stored post-deployment
      // status, // Frontend tracks this, backend can just store successful ones
    } = req.body;

    if (!contractName || !blockchain || !network || !contractAddress || !transactionHash || !abi) {
      return res.status(400).json({ message: 'Missing required deployment information (contractName, blockchain, network, contractAddress, transactionHash, abi).' });
    }

    if (!authenticatedReq.user || !authenticatedReq.user._id) { // Check for user and user._id
        return res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    }

    const newDeployment = new Deployment({
      userId: authenticatedReq.user._id, // From authMiddleware, ensure it's _id
      projectId,
      contractName,
      blockchain,
      network,
      contractAddress,
      transactionHash,
      abi: typeof abi === 'string' ? abi : JSON.stringify(abi), // Store ABI as string if needed
      status: 'success', // Assuming only successful deployments are logged by this endpoint
      // deploymentCost can be added later if fetched from receipt
    });

    const savedDeployment = await newDeployment.save();
    res.status(201).json(savedDeployment);
  } catch (error) {
    console.error("Error in createDeploymentRecord:", error); // Log the actual error on the server
    if (error instanceof Error) {
        res.status(500).json({ message: 'Error saving deployment record', error: error.message });
    } else {
        res.status(500).json({ message: 'Error saving deployment record', error: 'An unknown error occurred' });
    }
  }
};

export const getDeploymentsForUser = async (req: Request, res: Response) => {
  const authenticatedReq = req as any;
  try {
    if (!authenticatedReq.user || !authenticatedReq.user._id) { // Check for user and user._id
        return res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    }
    const deployments = await Deployment.find({ userId: authenticatedReq.user._id }).sort({ deployedAt: -1 });
    res.status(200).json(deployments);
  } catch (error) {
    console.error("Error in getDeploymentsForUser:", error); // Log the actual error
    if (error instanceof Error) {
        res.status(500).json({ message: 'Error fetching deployment records', error: error.message });
    } else {
        res.status(500).json({ message: 'Error fetching deployment records', error: 'An unknown error occurred' });
    }
  }
};
