import { MongoClient } from 'mongodb';

const uri = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB server at ' + uri);
    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();
    console.log('Databases available:');
    dbsList.databases.forEach(db => console.log(` - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`));
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } finally {
    await client.close();
  }
}

run();
