import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Folder } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { name } = await req.json();
    const folderPrefix = `folder-${nanoid(10)}/`;

    const db = await getDb();
    const folder: Folder = {
      name,
      gcsPrefix: folderPrefix,
      thumbnailPrefix: `thumbs/${folderPrefix}`,
      createdBy: new ObjectId(payload.adminId),
      createdAt: new Date(),
      sizeBytes: 0,
      status: 'active',
    };

    const result = await db.collection<Folder>('folders').insertOne(folder);

    return NextResponse.json({ folderId: result.insertedId, gcsPrefix: folderPrefix });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await getDb();
    const folders = await db.collection<Folder>('folders')
      .find({ createdBy: new ObjectId(payload.adminId) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ folders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}
