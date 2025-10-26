export interface Project {
  _id: string;
  name: string;
  language: 'typescript' | 'javascript' | 'python';
  description?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  fileCount: number;
  lastAnalyzed?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface Documentation {
  _id: string;
  projectId: string;
  fileName: string;
  type: 'function' | 'class' | 'method' | 'variable';
  summary: string;
  codeSnippet: string;
  createdAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
