import { MongoClient } from 'mongodb';

async function probe() {
  const client = new MongoClient('mongodb://127.0.0.1:27018/?directConnection=true');
  await client.connect();
  const res = await client.db('admin').command({ hello: 1 });
  console.log('Replica Set Probe:', {
    setName: res.setName,
    isWritablePrimary: res.isWritablePrimary,
    hosts: res.hosts,
    me: res.me
  });
  await client.close();
}

probe().catch(console.error);
