import { NextRequest, NextResponse } from 'next/server';

// Route segment config for Next.js 14
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Proxy endpoint for downloading images with proper headers
 * This ensures large images download correctly with proper content-type and filename
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');
    const filename = searchParams.get('filename');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    // Fetch the image from Cloudinary or other source
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();

    // Determine content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Determine filename
    let downloadFilename = filename || 'image.jpg';
    if (!downloadFilename.match(/\.(jpe?g|png|gif|webp|bmp)$/i)) {
      const ext = contentType.split('/')[1] || 'jpg';
      downloadFilename = `${downloadFilename}.${ext}`;
    }

    // Create response with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    );
  }
}
