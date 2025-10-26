import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentation extends Document {
  projectId: mongoose.Types.ObjectId;
  fileName: string;
  type: string;
  name: string;
  summary: string;
  codeSnippet: string;
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  returnType?: string;
  dependencies: string[];
}

const DocumentationSchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    fileName: { type: String, required: true },
    type: {
      type: String,
      required: true
    },
    name: { type: String, required: true },
    summary: { type: String, required: true },
    codeSnippet: { type: String, required: true },
    parameters: [{
      name: String,
      type: String,
      description: String,
    }],
    returnType: String,
    dependencies: [String],
  },
  { timestamps: true }
);

export default mongoose.model<IDocumentation>('Documentation', DocumentationSchema);
