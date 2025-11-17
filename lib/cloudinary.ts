import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(buffer: Buffer, folder: string, filename: string) {
  return new Promise((resolve, reject) => {
    // Remove file extension and special characters for public_id
    const cleanFilename = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: cleanFilename,
        resource_type: 'image',
        type: 'upload',
        overwrite: true,
        unique_filename: true,
        // Store original quality - no compression during upload
        quality: 'auto:best',
        // Keep original format
        format: undefined,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', result?.public_id, `(${(result?.bytes || 0) / 1024 / 1024}MB)`);
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<any> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
}

export async function deleteFolder(folderPath: string): Promise<any> {
  try {
    // Delete all resources in the folder
    await cloudinary.api.delete_resources_by_prefix(folderPath);
    // Delete the folder itself
    await cloudinary.api.delete_folder(folderPath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting folder from Cloudinary:', error);
    throw error;
  }
}

export async function getStorageUsage(): Promise<{ used: number; limit: number; percentage: number }> {
  try {
    const usage = await cloudinary.api.usage();
    const usedBytes = usage.storage.usage || 0;
    const limitBytes = 25 * 1024 * 1024 * 1024; // 25GB in bytes
    const percentage = (usedBytes / limitBytes) * 100;

    return {
      used: usedBytes,
      limit: limitBytes,
      percentage: Math.round(percentage * 100) / 100,
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return { used: 0, limit: 25 * 1024 * 1024 * 1024, percentage: 0 };
  }
}

export async function generateDownloadUrl(publicId: string): Promise<string> {
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    type: 'upload',
    resource_type: 'image',
  });
}

export async function generateThumbnailUrl(publicId: string): Promise<string> {
  // Generate public URL with transformations
  const url = cloudinary.url(publicId, {
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    secure: true,
    type: 'upload',
    resource_type: 'image',
  });

  console.log('Generated thumbnail URL for', publicId, ':', url);
  return url;
}

export async function generateSignedUrl(publicId: string, expiresInMinutes: number = 15): Promise<string> {
  // For downloads, provide the ORIGINAL quality image
  // No compression, no transformations - full quality download
  const url = cloudinary.url(publicId, {
    secure: true,
    type: 'upload',
    resource_type: 'image',
    flags: 'attachment', // Force download instead of display
    quality: 100, // Maximum quality
    fetch_format: 'auto', // Keep original format
  });

  console.log('Generated download URL for', publicId, ':', url);
  return url;
}

export function getPublicUrl(publicId: string): string {
  // For viewing in gallery, serve original quality
  const url = cloudinary.url(publicId, {
    secure: true,
    type: 'upload',
    resource_type: 'image',
    quality: 'auto:best', // Best quality for viewing
    fetch_format: 'auto', // Auto format optimization
  });

  console.log('Generated public URL for', publicId, ':', url);
  return url;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export { cloudinary };
