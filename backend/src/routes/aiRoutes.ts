import { Router } from 'express';
import aiController from '../controllers/aiController';

const router = Router();

/**
 * @swagger
 * /api/ai/ask:
 *   post:
 *     summary: Ask AI a question about code
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - question
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: Project ID
 *               question:
 *                 type: string
 *                 description: Question about the code
 *     responses:
 *       200:
 *         description: AI answer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     answer:
 *                       type: string
 */
router.post('/ask', aiController.ask);

export default router;
