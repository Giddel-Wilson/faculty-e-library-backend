import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());

// @ts-ignore: simple handler — relaxed typing for quick local server
app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'Simple server running' });
});

// @ts-ignore: simple handler
app.get('/health', (_req, res) => res.send('ok'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Simple server listening on http://localhost:${port}`);
});

export default app;
