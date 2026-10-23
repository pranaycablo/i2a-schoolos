import { spawn } from 'child_process';
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve('D:/i2A_School ERP & Managment/.mongo_rs_data');
const MONGOD_PATH = 'C:/Program Files/MongoDB/Server/8.3/bin/mongod.exe';
const PORT = 27018;

async function isPortOpen(port) {
  try {
    const client = new MongoClient(`mongodb://127.0.0.1:${port}/?directConnection=true&serverSelectionTimeoutMS=1000`);
    await client.connect();
    await client.close();
    return true;
  } catch {
    return false;
  }
}

async function ensureReplicaSet() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
  }

  const running = await isPortOpen(PORT);
  if (!running) {
    console.log(`[ReplicaSet] Spawning mongod on port ${PORT} with replSet rs0...`);
    const child = spawn(MONGOD_PATH, [
      '--port', String(PORT),
      '--dbpath', DB_PATH,
      '--replSet', 'rs0',
      '--bind_ip', '127.0.0.1'
    ], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    // Wait for mongod to start listening
    let ready = false;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (await isPortOpen(PORT)) {
        ready = true;
        break;
      }
    }
    if (!ready) {
      throw new Error(`Failed to start mongod on port ${PORT}`);
    }
    console.log(`[ReplicaSet] mongod process spawned successfully.`);
  } else {
    console.log(`[ReplicaSet] mongod is already listening on port ${PORT}.`);
  }

  // Connect and initiate replica set if needed
  const client = new MongoClient(`mongodb://127.0.0.1:${PORT}/?directConnection=true`);
  await client.connect();
  const admin = client.db('admin');

  try {
    await admin.command({ replSetInitiate: {} });
    console.log('[ReplicaSet] replSetInitiate completed.');
  } catch (err) {
    if (err.codeName === 'AlreadyInitialized' || (err.message && err.message.includes('already initialized'))) {
      console.log('[ReplicaSet] Replica set already initialized.');
    } else {
      console.error('[ReplicaSet] replSetInitiate notice:', err.message);
    }
  }

  // Wait for primary
  let isPrimary = false;
  for (let i = 0; i < 30; i++) {
    const status = await admin.command({ hello: 1 });
    if (status.isWritablePrimary) {
      isPrimary = true;
      console.log(`[ReplicaSet] rs0 on port ${PORT} is healthy and READY as PRIMARY (setName: ${status.setName}).`);
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  await client.close();

  if (!isPrimary) {
    throw new Error('Replica set election did not complete in time.');
  }
}

ensureReplicaSet().catch(err => {
  console.error('[ReplicaSet] Error:', err);
  process.exit(1);
});
