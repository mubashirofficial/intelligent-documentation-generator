import { Router } from 'express';
import analysisController from '../controllers/analysisController';

const router = Router();

/**
 * @swagger
 * /api/analyze:
 *   post:
 *     summary: Analyze code
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - code
 *               - fileName
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: Project ID
 *               code:
 *                 type: string
 *                 description: Source code to analyze
 *               fileName:
 *                 type: string
 *                 description: Name of the file (e.g., example.ts)
 *     responses:
 *       200:
 *         description: Analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.post('/', analysisController.analyze);

/**
 * @swagger
 * /api/analyze/progress/{sessionId}:
 *   get:
 *     summary: Get analysis progress via Server-Sent Events
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID for progress tracking
 *     responses:
 *       200:
 *         description: Progress stream
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
router.get('/progress/:sessionId', analysisController.getProgress);

/**
 * @swagger
 * /api/projects/{projectId}/docs:
 *   get:
 *     summary: Get documentation for project
 *     tags: [Documentation]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project documentation
 */
router.get('/projects/:projectId/docs', analysisController.getDocs);

/**
 * @swagger
 * /api/projects/{projectId}/search:
 *   get:
 *     summary: Search documentation
 *     tags: [Documentation]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/projects/:projectId/search', analysisController.search);

export default router;
