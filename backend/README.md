# Intelligent Documentation Generator - Backend (Swagger Fixed)

## ✅ Swagger Issue FIXED!

The endpoints now appear in Swagger because we added:
1. JSDoc comments above each route
2. Correct `apis` path in swagger configuration
3. Proper route registration

## Quick Start

\`\`\`bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your MongoDB URI and OpenAI API key

# Run
npm run dev
\`\`\`

## Access Swagger

Open http://localhost:5000/api-docs

You should now see all endpoints organized by tags:
- Projects
- Analysis  
- Documentation
- AI

## API Endpoints

### Projects
- GET /api/projects - List all projects
- POST /api/projects - Create project
- GET /api/projects/:id - Get project
- DELETE /api/projects/:id - Delete project

### Analysis
- POST /api/analyze - Analyze code

### Documentation
- GET /api/projects/:projectId/docs - Get documentation
- GET /api/projects/:projectId/search?q=query - Search docs

### AI
- POST /api/ai/ask - Ask AI questions

## Test Endpoints

\`\`\`bash
# Health check
curl http://localhost:5000/api/health

# Create project
curl -X POST http://localhost:5000/api/projects \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Test Project", "language": "typescript"}'
\`\`\`
