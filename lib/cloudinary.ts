import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(buffer: Buffer, folder: string, filename: string) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

export async function generateDownloadUrl(publicId: string): Promise<string> {
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    type: 'authenticated',
  });
}

export async function generateThumbnailUrl(publicId: string): Promise<string> {
  return cloudinary.url(publicId, {
    transformation: [
      { width: 400, height: 400, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
    secure: true,
  });
}

export async function generateSignedUrl(publicId: string, expiresInMinutes: number = 15): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000) + (expiresInMinutes * 60);

  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    type: 'authenticated',
    expires_at: timestamp,
  });
}

export { cloudinary };
