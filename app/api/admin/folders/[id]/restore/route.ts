import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Restore folder
    await db.collection('folders').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { status: 'active' }, $unset: { deletedAt: '' } }
    );

    // Restore all images in folder
    await db.collection('images').updateMany(
      { folderId: new ObjectId(params.id) },
      { $set: { status: 'active' }, $unset: { deletedAt: '' } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Restore folder error:', error);
    return NextResponse.json({ error: 'Failed to restore folder' }, { status: 500 });
  }
}
