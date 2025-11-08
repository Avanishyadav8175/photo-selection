import { MongoClient } from 'mongodb';

async function checkAdmin() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB Atlas...');

  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected successfully');

    const db = client.db();
    const admins = await db.collection('admins').find({}).toArray();

    console.log(`\n👥 Found ${admins.length} admin(s):`);
    admins.forEach((admin, i) => {
      console.log(`  ${i + 1}. ${admin.name} (${admin.email})`);
    });

    if (admins.length === 0) {
      console.log('\n⚠️  No admin users found. Run: npm run setup-admin');
    }

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdmin();
