import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';

let mongo;

export async function setupTestDb() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  return createApp();
}

export async function teardownTestDb() {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}
