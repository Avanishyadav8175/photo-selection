import { verifyToken } from '@/lib/auth';
import { deleteImage } from '@/lib/cloudinary';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({ permanent: false }));
    const { permanent } = body;

    const db = await getDb();
    const image = await db.collection('images').findOne({ _id: new ObjectId(params.id) });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (permanent) {
      // Permanent delete from Cloudinary
      try {
        await deleteImage(image.gcsPath);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
      }

      // Delete selections related to this image
      await db.collection('selections').deleteMany({ imageId: new ObjectId(params.id) });

      // Delete image from database
      await db.collection('images').deleteOne({ _id: new ObjectId(params.id) });
    } else {
      // Move to trash
      await db.collection('images').updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { status: 'deleted', deletedAt: new Date() } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
