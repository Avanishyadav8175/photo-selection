import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testDb() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');
  console.log('URI:', uri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    console.log('📊 Database:', db.databaseName);

    const admins = await db.collection('admins').find({}).toArray();
    console.log(`👥 Found ${admins.length} admin(s):`);

    admins.forEach((admin, i) => {
      console.log(`  ${i + 1}. ${admin.name} (${admin.email})`);
    });

    await client.close();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDb();
