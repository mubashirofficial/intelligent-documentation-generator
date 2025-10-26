import { Request, Response } from 'express';
import Project from '../models/Project';
import Documentation from '../models/Documentation';

export class ProjectController {
  async getAll(req: Request, res: Response) {
    try {
      const projects = await Project.find().sort({ createdAt: -1 });
      res.json({ success: true, data: projects });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch projects' });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      res.json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch project' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const project = new Project(req.body);
      await project.save();
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create project' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await Project.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Project deleted' });
      await Documentation.deleteMany({ projectId: req.params.id });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete project' });
    }
  }
}

export default new ProjectController();
