import { verifyToken } from '@/lib/auth';
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
    const clients = await db.collection('clients')
      .find({ folderId: new ObjectId(params.id) })
      .toArray();

    const clientsWithSelections = await Promise.all(
      clients.map(async (client) => {
        const selections = await db.collection('selections')
          .find({ clientId: client._id })
          .toArray();

        const images = await db.collection('images')
          .find({ _id: { $in: selections.map(s => s.imageId) } })
          .toArray();

        // Add Cloudinary URLs
        const { getPublicUrl } = await import('@/lib/cloudinary');
        const imagesWithUrls = images.map(img => ({
          ...img,
          thumbUrl: getPublicUrl(img.gcsPath),
        }));

        return {
          ...client,
          selectionsCount: selections.length,
          selections: imagesWithUrls,
        };
      })
    );

    return NextResponse.json({ clients: clientsWithSelections });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
