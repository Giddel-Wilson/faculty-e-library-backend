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

  // Default JSON parsers and swagger are registered regardless of DB state.
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  setupSwagger(app);

  // Try to initialize DB and AdminJS. If any required env is missing or
  // initialization fails (for example in a preview deploy without secrets),
  // fall back to a minimal app that exposes a health endpoint so Vercel
  // doesn't return 404 for requests.
  try {
    // If DATABASE_URL isn't present, skip DB init and return a minimal app.
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set — skipping DB/AdminJS initialization');
      // @ts-ignore: simple health handler — types are intentionally relaxed for serverless fallback
      app.get('/', (_req, res) => {
        return res.status(200).json({ ok: true, warning: 'DATABASE_URL not configured' });
      });
      // @ts-ignore: health endpoint
      app.get('/health', (_req, res) => res.send('ok'));
      return app;
    }

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
        cookiePassword: process.env.COOKIE_SECRET || 'please-set-cookie-secret',
        cookieName: 'adminjs',
        provider,
      },
      null,
      {
        secret: process.env.COOKIE_SECRET || 'please-set-cookie-secret',
        saveUninitialized: true,
        resave: true,
      }
    );

    app.use(admin.options.rootPath, router);
    app.use('/api/v1/', routes);

    return app;
  } catch (err) {
    // Log the error and return a minimal app so the serverless function responds
    // instead of failing during cold start.
    // eslint-disable-next-line no-console
    console.error('App initialization failed:', err && (err.stack || err));
    // @ts-ignore: fallback endpoints for failed initialization
    app.get('/', (_req, res) => {
      return res.status(500).json({ ok: false, error: 'initialization_failed' });
    });
    // @ts-ignore: health endpoint
    app.get('/health', (_req, res) => res.send('error'));
    return app;
  }
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
