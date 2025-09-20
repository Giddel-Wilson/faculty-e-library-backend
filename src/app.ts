import express from 'express';
import AdminJS from 'adminjs';
import { buildAuthenticatedRouter } from '@adminjs/express';
import routes from './routes/index.js';
import provider from './admin/auth-provider.js';
import options from './admin/options.js';
import initializeDb from './db/index.js';
import dotenv from 'dotenv';
import cors from 'cors';
import { setupSwagger } from './swagger.js';

dotenv.config();

// Export a function that creates and returns the Express app instance.
// This lets us run the app both as a normal Node server (local) and as a
// serverless function on Vercel.
export async function createApp() {
  const app = express();

  // Apply CORS middleware first, before any routes
  app.use(cors());

  await initializeDb();

  const admin = new AdminJS(options);

  if (process.env.NODE_ENV === 'production') {
    await admin.initialize();
  } else {
    admin.watch();
  }

  const router = buildAuthenticatedRouter(
    admin,
    {
      cookiePassword: process.env.COOKIE_SECRET,
      cookieName: 'adminjs',
      provider,
    },
    null,
    {
      secret: process.env.COOKIE_SECRET,
      saveUninitialized: true,
      resave: true,
    }
  );

  // Setup Swagger documentation
  setupSwagger(app);

  app.use(admin.options.rootPath, router);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use('/api/v1/', routes);

  return app;
}

// If this file is run directly (node dist/app.js) then start an HTTP server.
if (process.argv[1] && process.argv[1].endsWith('dist/app.js')) {
  (async () => {
    const port = process.env.PORT || 3000;
    const app = await createApp();
    app.listen(port, () => {
      console.log(`AdminJS available at http://localhost:${port}`);
      console.log(`API documentation available at http://localhost:${port}/api-docs`);
    });
  })();
}
