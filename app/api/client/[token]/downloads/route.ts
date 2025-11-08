import { generateSignedUrl } from '@/lib/cloudinary';
import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const db = await getDb();
    const client = await db.collection('clients').findOne({ token: params.token });

    if (!client) {
      return NextResponse.json({ error: 'Invalid client token' }, { status: 401 });
    }

    if (!client.downloadGranted) {
      return NextResponse.json({ error: 'Download not granted yet' }, { status: 403 });
    }

    const selections = await db.collection('selections')
      .find({ clientId: client._id })
      .toArray();

    const images = await db.collection('images')
      .find({ _id: { $in: selections.map(s => s.imageId) } })
      .toArray();

    const downloads = await Promise.all(
      images.map(async (img) => {
        const url = await generateSignedUrl(img.gcsPath, 15);
        return {
          imageId: img._id,
          filename: img.filename,
          downloadUrl: url,
        };
      })
    );

    return NextResponse.json({ downloads });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate download URLs' }, { status: 500 });
  }
}
