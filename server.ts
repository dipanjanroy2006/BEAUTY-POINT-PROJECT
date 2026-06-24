import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDB } from './server/db';
import apiRouter from './server/routes/api';

async function startServer() {
  // 1. Initialize relational-style JSON database
  await initDB();

  const app = express();
  const PORT = 3000;

  // 2. Body Parser Middleware
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // 3. Serve Static Uploads
  const publicDir = path.join(process.cwd(), 'public');
  const uploadsDir = path.join(publicDir, 'uploads');
  
  // Expose the uploads folder statically
  app.use('/uploads', express.static(uploadsDir));
  app.use(express.static(publicDir));

  // 4. API Routes Setup
  app.use('/api', apiRouter);

  // Health Check route alias
  app.get('/health', (req, res) => {
    res.redirect('/api/health');
  });

  // 5. Integration of Front-End Assets / Bundlers
  if (process.env.NODE_ENV !== 'production') {
    console.log("Configuring Vite Development Middleware...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: 'spa',
    });
    
    // Connect Vite asset injection middleware
    app.use(vite.middlewares);
  } else {
    console.log("Serving production build from dist...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Fallback all non-API paths to client SPA
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 6. Listen on Port 3000 (bind 0.0.0.0 for container accessibility)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`--------------------------------------------------`);
    console.log(`BEAUTY POINT SERVER IS ACTIVE AND RUNNING`);
    console.log(`Local Development Link: http://localhost:${PORT}`);
    console.log(`Listening on host: 0.0.0.0`);
    console.log(`--------------------------------------------------`);
  });
}

startServer().catch(err => {
  console.error("FATAL: Failed to initiate server:", err);
});
