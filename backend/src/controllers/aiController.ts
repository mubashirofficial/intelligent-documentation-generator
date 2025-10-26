import { Request, Response } from 'express';
import aiService from '../services/aiService';
import Documentation from '../models/Documentation';

export class AIController {
  async ask(req: Request, res: Response) {
    try {
      const { projectId, question } = req.body;

      if (!projectId || !question) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      // Get context from documentation
      const docs = await Documentation.find({ projectId }).limit(10);
      const context = docs.map(d => `${d.name}: ${d.summary}`).join('\n');

      const answer = await aiService.answerQuestion(question, context);

      res.json({ success: true, data: { answer } });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get answer' });
    }
  }
}

export default new AIController();
