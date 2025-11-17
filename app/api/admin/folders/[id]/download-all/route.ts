import { verifyToken } from '@/lib/auth';
import { getPublicUrl } from '@/lib/cloudinary';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const images = await db.collection('images')
      .find({
        folderId: new ObjectId(params.id),
        status: { $ne: 'deleted' }
      })
      .toArray();

    const imageUrls = images.map(img => ({
      filename: img.filename,
      url: getPublicUrl(img.gcsPath),
    }));

    return NextResponse.json({ images: imageUrls });
  } catch (error) {
    console.error('Download all error:', error);
    return NextResponse.json({ error: 'Failed to generate download URLs' }, { status: 500 });
  }
}
