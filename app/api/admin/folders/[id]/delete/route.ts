import { verifyToken } from '@/lib/auth';
import { deleteFolder } from '@/lib/cloudinary';
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
    const folder = await db.collection('folders').findOne({ _id: new ObjectId(params.id) });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (permanent) {
      // Permanent delete from Cloudinary
      try {
        await deleteFolder(folder.gcsPrefix);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
      }

      // Delete all related data from database
      await db.collection('images').deleteMany({ folderId: new ObjectId(params.id) });
      await db.collection('otps').deleteMany({ folderId: new ObjectId(params.id) });

      const clients = await db.collection('clients').find({ folderId: new ObjectId(params.id) }).toArray();
      const clientIds = clients.map(c => c._id);

      await db.collection('selections').deleteMany({ clientId: { $in: clientIds } });
      await db.collection('clients').deleteMany({ folderId: new ObjectId(params.id) });
      await db.collection('folders').deleteOne({ _id: new ObjectId(params.id) });
    } else {
      // Move to trash
      await db.collection('folders').updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { status: 'deleted', deletedAt: new Date() } }
      );

      // Mark all images as deleted
      await db.collection('images').updateMany(
        { folderId: new ObjectId(params.id) },
        { $set: { status: 'deleted', deletedAt: new Date() } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete folder error:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
