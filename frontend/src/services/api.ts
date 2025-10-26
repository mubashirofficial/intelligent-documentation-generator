import axios from 'axios';
import type { Project } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Separate instance for fire-and-forget calls with longer timeout
const fireAndForgetApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000, // 2 minutes timeout for fire-and-forget calls
});

export const apiService = {
  async getProjects(): Promise<Project[]> {
    const { data } = await api.get('/api/projects');
    return data.data || data;
  },

  async createProject(projectData: Partial<Project>): Promise<Project> {
    const { data } = await api.post('/api/projects', projectData);
    return data.data || data;
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/api/projects/${id}`);
  },

  async analyzeCode(projectId: string, code: string, fileName: string, sessionId?: string) {
    const { data } = await fireAndForgetApi.post(`/api/analyze`, { projectId, code, fileName, sessionId });
    return data;
  },

  // Progress streaming
  subscribeToProgress(sessionId: string, onProgress: (data: any) => void) {
    const eventSource = new EventSource(`${API_URL}/api/analyze/progress/${sessionId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onProgress(data);
      } catch (error) {
        console.log('Error parsing progress data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.log('Progress stream error:', error);
      eventSource.close();
    };

    return eventSource;
  },

  async analyzeFile(projectId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    const { data } = await api.post(`/api/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getDocumentation(projectId: string) {
    const { data } = await api.get(`/api/projects/${projectId}/docs`);
    return data;
  },

  async searchDocs(projectId: string, query: string) {
    const { data } = await api.get(`/api/projects/${projectId}/search`, { params: { q: query } });
    return data;
  },

  async askQuestion(projectId: string, question: string) {
    const { data } = await api.post('/api/ai/ask', { projectId, question });
    return data;
  },
};

export default apiService;
