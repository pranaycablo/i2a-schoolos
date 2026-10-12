import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'i2a_schoolos';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let dbClient = null;
let db = null;

async function getDb() {
  if (!db) {
    dbClient = new MongoClient(MONGO_URI);
    await dbClient.connect();
    db = dbClient.db(DB_NAME);
  }
  return db;
}

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const database = await getDb();
    const stats = await database.command({ dbStats: 1 });
    res.json({ status: 'ONLINE', database: DB_NAME, stats });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// Generic Collection Fetch
app.get('/api/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const database = await getDb();
    const data = await database.collection(collection).find({}).toArray();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Collection Update/Insert
app.post('/api/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const database = await getDb();
    const item = req.body;
    if (item.id) {
      await database.collection(collection).updateOne(
        { id: item.id },
        { $set: item },
        { upsert: true }
      );
    } else {
      await database.collection(collection).insertOne(item);
    }
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full Sync Endpoint (Bidirectional sync between frontend and MongoDB)
app.post('/api/sync/all', async (req, res) => {
  try {
    const database = await getDb();
    const payload = req.body; // { students, admissions, feeReceipts, etc. }
    for (const [key, items] of Object.entries(payload)) {
      if (Array.isArray(items) && items.length > 0) {
        const col = database.collection(key);
        for (const it of items) {
          if (it.id) {
            await col.updateOne({ id: it.id }, { $set: it }, { upsert: true });
          }
        }
      }
    }
    res.json({ success: true, message: 'All collections synchronized to MongoDB.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🌐 i2A SchoolOS API Server running on http://localhost:${PORT}`);
  console.log(`🗄️ Connected to MongoDB Database: ${DB_NAME}`);
});
