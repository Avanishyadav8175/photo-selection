import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    await db.collection('clients').updateOne(
      { _id: new ObjectId(params.clientId) },
      { $set: { downloadGranted: true, downloadGrantedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to grant download' }, { status: 500 });
  }
}
