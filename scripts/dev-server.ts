// scripts/dev-server.ts
import { config } from 'dotenv';
import next from 'next';

// Load environment variables from .env file
config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 9002;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const { createServer } = require('http');
  createServer(handle).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
