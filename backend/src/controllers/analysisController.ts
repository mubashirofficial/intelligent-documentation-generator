import { Request, Response } from 'express';
import aiService from '../services/aiService';
import Documentation from '../models/Documentation';
import Project from '../models/Project';

// Store for progress tracking
const progressStore = new Map<string, { progress: number; status: string; message: string }>();

export class AnalysisController {
  // Progress streaming endpoint
  async getProgress(req: Request, res: Response) {
    const { sessionId } = req.params;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    const sendProgress = (progress: number, status: string, message: string) => {
      res.write(`data: ${JSON.stringify({ progress, status, message })}\n\n`);
    };

    // Send initial progress
    sendProgress(0, 'starting', 'Initializing analysis...');

    // Check progress every 500ms
    const interval = setInterval(() => {
      const progressData = progressStore.get(sessionId);
      if (progressData) {
        sendProgress(progressData.progress, progressData.status, progressData.message);
        
        // Close connection when analysis is complete
        if (progressData.status === 'completed' || progressData.status === 'error') {
          clearInterval(interval);
          res.end();
        }
      }
    }, 500);

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(interval);
      progressStore.delete(sessionId);
    });
  }

  async analyze(req: Request, res: Response) {
    const sessionId = req.body.sessionId || Date.now().toString();
    
    try {
      const { projectId, code, fileName } = req.body;

      if (!projectId || !code || !fileName) {
        progressStore.set(sessionId, { progress: 0, status: 'error', message: 'Missing required fields' });
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      // Initialize progress
      progressStore.set(sessionId, { progress: 10, status: 'parsing', message: 'Analyzing code structure...' });

      // Detect language from file extension
      const language = fileName.split('.').pop()?.toLowerCase() === 'py' ? 'python' : 
                     fileName.split('.').pop()?.toLowerCase() === 'ts' || fileName.split('.').pop()?.toLowerCase() === 'tsx' ? 'typescript' : 'javascript';
      
      console.log('Language detected:', language);
      
      progressStore.set(sessionId, { progress: 30, status: 'updating', message: 'Updating project information...' });

      // Update project
      await Project.findByIdAndUpdate(projectId, {
        language,
        status: 'analyzing',
        lastAnalyzed: new Date(),
      });

      // Generate documentation for entire file
      progressStore.set(sessionId, { progress: 40, status: 'generating', message: 'Generating comprehensive documentation...' });

      const summary = await aiService.generateFileDocumentation(code, fileName, language);

      // Create a single documentation entry for the entire file
      const doc = new Documentation({
        projectId,
        fileName,
        type: 'file',
        name: fileName,
        summary,
        codeSnippet: code,
        dependencies: [],
      });

      await doc.save();
      const docs = [doc];

      progressStore.set(sessionId, { progress: 90, status: 'finalizing', message: 'Finalizing documentation...' });

      // Update project status
      await Project.findByIdAndUpdate(projectId, {
        status: 'completed',
        fileCount: 1,
      });

      progressStore.set(sessionId, { progress: 100, status: 'completed', message: 'Analysis completed successfully!' });

      res.json({
        success: true,
        sessionId,
        data: {
          language,
          filesAnalyzed: 1,
          itemsFound: docs.length,
          documentation: docs,
        },
      });
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      progressStore.set(sessionId, { progress: 0, status: 'error', message: 'Analysis failed: ' + errorMessage });
      res.status(500).json({ success: false, error: 'Analysis failed' });
    }
  }

  async getDocs(req: Request, res: Response) {
    try {
      const docs = await Documentation.find({ projectId: req.params.projectId });

      const groupedDocs = docs.reduce((acc: any, doc) => {
        if (!acc[doc.fileName]) {
          acc[doc.fileName] = [];
        }
        acc[doc.fileName].push(doc);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          projectId: req.params.projectId,
          totalDocs: docs.length,
          documentation: groupedDocs,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch documentation' });
    }
  }

  async search(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { q } = req.query;

      const docs = await Documentation.find({
        projectId,
        $or: [
          { name: { $regex: q as string, $options: 'i' } },
          { summary: { $regex: q as string, $options: 'i' } },
        ],
      }).limit(20);

      res.json({ success: true, data: docs });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Search failed' });
    }
  }
}

export default new AnalysisController();
