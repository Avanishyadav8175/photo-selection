import { verifyOTP } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Client } from '@/lib/types';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { publicToken, name, phone, otp } = await req.json();

    const db = await getDb();
    const folder = await db.collection('folders').findOne({ publicToken });

    if (!folder || folder.status !== 'active') {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
    }

    const otpDoc = await db.collection('otps').findOne({
      folderId: folder._id,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }

    const isValid = await verifyOTP(otp, otpDoc.otpHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Allow multiple clients with same OTP - check by phone only
    let client = await db.collection<Client>('clients').findOne({
      folderId: folder._id,
      phone,
    });

    if (!client) {
      const clientToken = nanoid(32);
      const newClient: Client = {
        folderId: folder._id!,
        name,
        phone,
        token: clientToken,
        createdAt: new Date(),
        downloadGranted: false,
      };
      const result = await db.collection<Client>('clients').insertOne(newClient);
      client = { ...newClient, _id: result.insertedId };
    } else {
      // Update name if client exists (in case they want to update it)
      await db.collection('clients').updateOne(
        { _id: client._id },
        { $set: { name } }
      );
    }

    return NextResponse.json({ clientToken: client.token, clientId: client._id });
  } catch (error) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
