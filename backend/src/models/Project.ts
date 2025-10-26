import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  language: 'typescript' | 'javascript' | 'python';
  description?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  fileCount: number;
  lastAnalyzed?: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    language: {
      type: String,
      required: true,
      enum: ['typescript', 'javascript', 'python'],
      default: 'typescript',
    },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'analyzing', 'completed', 'failed'],
      default: 'pending',
    },
    fileCount: { type: Number, default: 0 },
    lastAnalyzed: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', ProjectSchema);
