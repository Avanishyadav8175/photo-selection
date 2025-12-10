import { generateOTP, hashOTP, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { OTP } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { expiresInHours = 168 } = await req.json();
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    const db = await getDb();
    const otpDoc: OTP = {
      folderId: new ObjectId(params.id),
      otpHash,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
      createdAt: new Date(),
      createdBy: new ObjectId(payload.adminId),
    };

    await db.collection<OTP>('otps').insertOne(otpDoc);

    const publicToken = nanoid(20);
    await db.collection('folders').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { publicToken } }
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://photo-selection-d9ny.vercel.app';
    const clientLink = `${appUrl}/f/${publicToken}`;

    return NextResponse.json({ otp, clientLink, expiresAt: otpDoc.expiresAt });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
  }
}
