import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDeployment extends Document {
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  blockchain: string;
  network: string;
  contractAddress?: string;
  transactionHash?: string;
  status: 'pending' | 'success' | 'failed';
  deploymentCost?: string;
  deployedAt: Date;
}

const DeploymentSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  blockchain: { type: String, required: true },
  network: { type: String, required: true },
  contractAddress: { type: String },
  transactionHash: { type: String },
  status: { type: String, enum: ['pending', 'success', 'failed'], required: true },
  deploymentCost: { type: String },
  deployedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IDeployment>('Deployment', DeploymentSchema);
