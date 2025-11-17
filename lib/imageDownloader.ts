/**
 * Robust Image Downloader Utility
 * Handles large image downloads with retry logic and proper file naming
 */

interface DownloadOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  onProgress?: (progress: number) => void;
}

interface DownloadResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

/**
 * Download a single image with retry logic
 */
export async function downloadImageWithRetry(
  url: string,
  filename: string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 60000, // 60 seconds
    onProgress,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for ${filename}`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }

      const blob = await fetchImageWithTimeout(url, timeout, onProgress);

      // Verify blob is valid
      if (!blob || blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Verify it's an image
      if (!blob.type.startsWith('image/')) {
        console.warn(`Warning: ${filename} has type ${blob.type}, expected image/*`);
      }

      return { success: true, blob };
    } catch (error) {
      lastError = error as Error;
      console.error(`Download attempt ${attempt + 1} failed for ${filename}:`, error);
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Download failed after all retries',
  };
}

/**
 * Fetch image with timeout and progress tracking
 */
async function fetchImageWithTimeout(
  url: string,
  timeout: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get content length for progress tracking
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Read the response with progress tracking
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (onProgress && total > 0) {
        onProgress((receivedLength / total) * 100);
      }
    }

    // Combine chunks into a single blob
    const blob = new Blob(chunks, {
      type: response.headers.get('content-type') || 'image/jpeg',
    });

    return blob;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Download a single image file
 */
export async function downloadSingleImage(
  url: string,
  filename: string,
  options: DownloadOptions = {}
): Promise<boolean> {
  const result = await downloadImageWithRetry(url, filename, options);

  if (!result.success || !result.blob) {
    console.error(`Failed to download ${filename}: ${result.error}`);
    return false;
  }

  // Create download link with proper filename
  const blobUrl = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up blob URL after a delay
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

  return true;
}

/**
 * Download multiple images as a ZIP file
 */
export async function downloadImagesAsZip(
  images: Array<{ url: string; filename: string }>,
  zipFilename: string,
  onProgress?: (current: number, total: number, currentFile: string) => void
): Promise<boolean> {
  try {
    // Import JSZip dynamically
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    let successCount = 0;
    let failedFiles: string[] = [];

    // Download and add each image to the zip
    for (let i = 0; i < images.length; i++) {
      const { url, filename } = images[i];

      if (onProgress) {
        onProgress(i, images.length, filename);
      }

      const result = await downloadImageWithRetry(url, filename, {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 60000,
      });

      if (result.success && result.blob) {
        zip.file(filename, result.blob);
        successCount++;
      } else {
        console.error(`Failed to download ${filename}: ${result.error}`);
        failedFiles.push(filename);
      }
    }

    if (successCount === 0) {
      throw new Error('No images were successfully downloaded');
    }

    // Show warning if some files failed
    if (failedFiles.length > 0) {
      console.warn(`Failed to download ${failedFiles.length} files:`, failedFiles);
      const proceed = confirm(
        `${failedFiles.length} file(s) failed to download. Continue with ${successCount} successful downloads?`
      );
      if (!proceed) {
        return false;
      }
    }

    if (onProgress) {
      onProgress(images.length, images.length, 'Generating ZIP file...');
    }

    // Generate and download the zip file
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Create download link
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipFilename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);

    return true;
  } catch (error) {
    console.error('Failed to create ZIP file:', error);
    return false;
  }
}

/**
 * Get file extension from filename or URL
 */
export function getFileExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
}

/**
 * Ensure filename has proper extension
 */
export function ensureFileExtension(filename: string, url: string): string {
  if (/\.(jpe?g|png|gif|webp|bmp)$/i.test(filename)) {
    return filename;
  }

  // Try to get extension from URL
  const urlMatch = url.match(/\.([^./?#]+)(?:[?#]|$)/);
  const ext = urlMatch ? urlMatch[1].toLowerCase() : 'jpg';

  return `${filename}.${ext}`;
}
