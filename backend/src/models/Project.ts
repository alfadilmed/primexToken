import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProject extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  editorData?: object;
  smartContractConfig?: object;
  status: 'draft' | 'deployed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  editorData: { type: Object },
  smartContractConfig: { type: Object },
  status: { type: String, enum: ['draft', 'deployed', 'error'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware to update `updatedAt` field before saving
ProjectSchema.pre<IProject>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IProject>('Project', ProjectSchema);
