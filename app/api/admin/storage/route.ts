import { verifyToken } from '@/lib/auth';
import { formatBytes, getStorageUsage } from '@/lib/cloudinary';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await getStorageUsage();

    return NextResponse.json({
      used: usage.used,
      limit: usage.limit,
      percentage: usage.percentage,
      usedFormatted: formatBytes(usage.used),
      limitFormatted: formatBytes(usage.limit),
    });
  } catch (error) {
    console.error('Storage usage error:', error);
    return NextResponse.json({ error: 'Failed to get storage usage' }, { status: 500 });
  }
}
