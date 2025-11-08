import { generateThumbnailUrl } from '@/lib/cloudinary';
import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const db = await getDb();
    const client = await db.collection('clients').findOne({ token: params.token });

    if (!client) {
      return NextResponse.json({ error: 'Invalid client token' }, { status: 401 });
    }

    const images = await db.collection('images')
      .find({ folderId: client.folderId })
      .toArray();

    const imagesWithUrls = await Promise.all(
      images.map(async (img) => {
        const thumbUrl = await generateThumbnailUrl(img.thumbPath);
        return {
          _id: img._id,
          filename: img.filename,
          thumbUrl,
        };
      })
    );

    return NextResponse.json({ images: imagesWithUrls });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}
