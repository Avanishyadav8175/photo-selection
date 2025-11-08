import { verifyToken } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
import { getDb } from '@/lib/db';
import { Image } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const db = await getDb();
    const folder = await db.collection('folders').findOne({ _id: new ObjectId(params.id) });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await uploadImage(buffer, folder.gcsPrefix, file.name) as any;

    // Save image metadata to database
    const image: Image = {
      folderId: new ObjectId(params.id),
      filename: file.name,
      gcsPath: result.public_id,
      thumbPath: result.public_id,
      mimeType: file.type,
      sizeBytes: file.size,
      createdAt: new Date(),
    };

    const insertResult = await db.collection<Image>('images').insertOne(image);

    return NextResponse.json({
      success: true,
      imageId: insertResult.insertedId,
      url: result.secure_url
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
