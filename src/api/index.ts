import { createApp } from '../app.js';

// Initialize the app once and reuse between invocations.
let appPromise: Promise<any> | null = null;

export default async function handler(req: any, res: any) {
  // If the deployment doesn't have the database URL (common in previews),
  // respond immediately with a lightweight health message so Vercel doesn't
  // return a 404 when initialization would otherwise fail.
  if (!process.env.DATABASE_URL) {
    try {
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: false, warning: 'DATABASE_URL not configured' }));
    } catch (e) {
      // If headers can't be set, swallow and close.
      try { res.end(); } catch (_) {}
    }
    return;
  }

  try {
    if (!appPromise) appPromise = createApp();
    const app = await appPromise;
    // Express apps are callable: app(req, res)
    return app(req, res);
  } catch (err) {
    // Initialization failed — return JSON 500 instead of letting the function crash
    // which would surface as NOT_FOUND on Vercel.
    try {
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: 'initialization_failed' }));
    } catch (e) {
      try { res.end(); } catch (_) {}
    }
    return;
  }
}
