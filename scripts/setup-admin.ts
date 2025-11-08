import { MongoClient } from 'mongodb';
import * as readline from 'readline';
import { hashPassword } from '../lib/auth';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setupAdmin() {
  const uri = "mongodb+srv://keshavgupta86036:FST2023k@cluster0.06aqope.mongodb.net/floriwis" ;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  const name = await question('Admin name: ');
  const email = await question('Admin email: ');
  const password = await question('Admin password: ');

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const passwordHash = await hashPassword(password);

  await db.collection('admins').insertOne({
    name,
    email,
    passwordHash,
    role: 'admin',
    createdAt: new Date(),
  });

  console.log('Admin user created successfully!');
  await client.close();
  rl.close();
}

setupAdmin().catch(console.error);
