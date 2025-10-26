export interface Project {
  _id: string;
  name: string;
  language: 'typescript' | 'javascript' | 'python';
  description?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  fileCount: number;
  lastAnalyzed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Documentation {
  _id: string;
  projectId: string;
  fileName: string;
  type: 'function' | 'class' | 'method' | 'variable';
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ParsedNode {
  type: string;
  name: string;
  startLine: number;
  endLine: number;
  code: string;
}
