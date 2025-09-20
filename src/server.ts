import { createApp } from './app.js';

(async () => {
  const port = process.env.PORT || 3000;
  const app = await createApp();
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
})();
