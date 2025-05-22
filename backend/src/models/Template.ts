import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  description?: string;
  category?: string;
  previewImage?: string;
  editorData?: object;
  smartContractCode?: string;
  defaultConfig?: object;
}

const TemplateSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  previewImage: { type: String },
  editorData: { type: Object },
  smartContractCode: { type: String },
  defaultConfig: { type: Object },
});

export default mongoose.model<ITemplate>('Template', TemplateSchema);
