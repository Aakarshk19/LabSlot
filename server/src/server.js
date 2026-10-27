import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

const app = createApp();
let server;

async function start() {
  await connectDb();
  server = app.listen(env.port, () => {
    console.log(`LabSlot API listening on http://localhost:${env.port}`);
  });
}

function shutdown() {
  if (!server) process.exit(0);
  server.close(async () => {
    const mongoose = (await import('mongoose')).default;
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 8000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
