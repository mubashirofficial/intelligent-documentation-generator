import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Import routes
import projectRoutes from './routes/projectRoutes';
import analysisRoutes from './routes/analysisRoutes';
import aiRoutes from './routes/aiRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || '')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Swagger Configuration - THIS IS THE FIX!
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Intelligent Documentation Generator API',
      version: '2.0.0',
      description: 'AI-powered documentation generator with Tree-sitter',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Projects', description: 'Project management endpoints' },
      { name: 'Analysis', description: 'Code analysis endpoints' },
      { name: 'Documentation', description: 'Documentation retrieval' },
      { name: 'AI', description: 'AI-powered features' },
    ],
  },
  // THIS IS KEY: Point to the routes with JSDoc comments
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Routes - IMPORTANT: Register routes AFTER Swagger setup
app.use('/api/projects', projectRoutes);
app.use('/api/analyze', analysisRoutes);
app.use('/api', analysisRoutes); // For /api/projects/:projectId/docs and search
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Swagger API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`✨ Endpoints will now appear in Swagger!\n`);
});
