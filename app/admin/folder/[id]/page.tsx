'use client';

import { downloadImagesAsZip } from '@/lib/imageDownloader';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FolderManagement() {
  const params = useParams();
  const router = useRouter();
  const [images, setImages] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [otp, setOtp] = useState('');
  const [clientLink, setClientLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showImagesModal, setShowImagesModal] = useState(false);

  useEffect(() => {
    loadImages();
    loadClients();
    const interval = setInterval(loadClients, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadImages = async () => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`/api/admin/folders/${params.id}/images`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      console.log('Loaded images:', data.images.length, data.images[0]);
      setImages(data.images);
    }
  };

  const loadClients = async () => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`/api/admin/folders/${params.id}/clients`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setClients(data.clients);
    }
  };

  const generateOTP = async () => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`/api/admin/folders/${params.id}/generate-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ expiresInHours: 168 }),
    });

    if (res.ok) {
      const data = await res.json();
      setOtp(data.otp);
      setClientLink(data.clientLink);
      setShowOTPModal(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB

    if (totalSize > maxSize) {
      alert('Total file size exceeds 10GB limit');
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: fileArray.length });
    const token = localStorage.getItem('adminToken');
    let uploaded = 0;

    // Import image compression library
    const imageCompression = (await import('browser-image-compression')).default;

    // HIGH QUALITY compression options - maintains excellent quality while staying under 10MB
    const compressionOptions = {
      maxSizeMB: 9.8, // Just under 10MB limit
      maxWidthOrHeight: 6000, // Very high resolution (suitable for printing)
      useWebWorker: true,
      initialQuality: 0.95, // Very high quality (95%)
      alwaysKeepResolution: true, // Maintain original resolution if possible
    };

    // Upload files in parallel (3 at a time)
    const batchSize = 3;
    for (let i = 0; i < fileArray.length; i += batchSize) {
      const batch = fileArray.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (file) => {
          try {
            let fileToUpload: File | Blob = file;
            const originalFilename = file.name;
            const originalSizeMB = file.size / 1024 / 1024;

            // Compress if file is larger than 10MB (Cloudinary free tier limit)
            if (file.size > 10 * 1024 * 1024) {
              console.log(`Compressing ${file.name} (${originalSizeMB.toFixed(2)}MB) with HIGH QUALITY settings...`);
              const compressedBlob = await imageCompression(file, compressionOptions);
              const compressedSizeMB = compressedBlob.size / 1024 / 1024;
              console.log(`Compressed to ${compressedSizeMB.toFixed(2)}MB (${((1 - compressedSizeMB / originalSizeMB) * 100).toFixed(1)}% reduction, maintaining high quality)`);

              // Convert compressed blob back to File with original filename
              fileToUpload = new File([compressedBlob], originalFilename, {
                type: compressedBlob.type || file.type,
                lastModified: Date.now(),
              });
            } else {
              console.log(`Uploading ${file.name} (${originalSizeMB.toFixed(2)}MB) without compression...`);
            }

            const formData = new FormData();
            formData.append('file', fileToUpload, originalFilename);

            await fetch(`/api/admin/folders/${params.id}/upload`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            });

            uploaded++;
            setUploadProgress({ current: uploaded, total: fileArray.length });
            console.log(`Uploaded ${uploaded}/${fileArray.length} files`);
          } catch (err) {
            console.error('Upload failed for', file.name, ':', err);
          }
        })
      );
    }

    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    loadImages();
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm('Delete this image?')) return;

    const token = localStorage.getItem('adminToken');
    const res = await fetch(`/api/admin/images/${imageId}/delete`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      loadImages();
    }
  };

  const grantDownload = async (clientId: string) => {
    const token = localStorage.getItem('adminToken');
    await fetch(`/api/admin/clients/${clientId}/grant-download`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    loadClients();
  };

  const viewClientSelections = (client: any) => {
    setSelectedClient(client);
    setShowImagesModal(true);
  };

  const downloadClientSelections = async (client: any) => {
    if (!client.selections || client.selections.length === 0) return;

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/folders/${params.id}/download-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();

        // Filter to only selected images
        const selectedImages = data.images.filter((img: any) =>
          client.selections.some((s: any) => s.filename === img.filename)
        );

        if (selectedImages.length === 0) {
          alert('No images to download');
          return;
        }

        const confirmed = confirm(`Download ${selectedImages.length} selected images as a ZIP file?`);
        if (!confirmed) return;

        // Show progress dialog
        const progressDiv = document.createElement('div');
        progressDiv.id = 'download-progress';
        progressDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:9999;min-width:300px;text-align:center;';
        progressDiv.innerHTML = '<div style="font-size:16px;font-weight:600;margin-bottom:10px;">Downloading images...</div><div id="progress-text" style="color:#666;font-size:14px;">Starting...</div>';
        document.body.appendChild(progressDiv);

        try {
          const success = await downloadImagesAsZip(
            selectedImages.map((img: any) => ({
              url: img.url,
              filename: img.filename,
            })),
            `${client.name}-selections-${Date.now()}.zip`,
            (current, total, currentFile) => {
              const progressText = document.getElementById('progress-text');
              if (progressText) {
                if (currentFile === 'Generating ZIP file...') {
                  progressText.textContent = currentFile;
                } else {
                  progressText.textContent = `${current + 1}/${total}: ${currentFile}`;
                }
              }
            }
          );

          document.body.removeChild(progressDiv);

          if (success) {
            alert('ZIP file downloaded successfully!');
          } else {
            alert('Failed to download some images. Please try again.');
          }
        } catch (error) {
          document.body.removeChild(progressDiv);
          throw error;
        }
      }
    } catch (error) {
      console.error('Download selections failed:', error);
      alert('Failed to download images');
    }
  };

  const downloadAllImages = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/folders/${params.id}/download-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();

        if (data.images.length === 0) {
          alert('No images to download');
          return;
        }

        const confirmed = confirm(`Download all ${data.images.length} images as a ZIP file?`);
        if (!confirmed) return;

        // Show progress dialog
        const progressDiv = document.createElement('div');
        progressDiv.id = 'download-progress';
        progressDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:9999;min-width:300px;text-align:center;';
        progressDiv.innerHTML = '<div style="font-size:16px;font-weight:600;margin-bottom:10px;">Downloading images...</div><div id="progress-text" style="color:#666;font-size:14px;">Starting...</div>';
        document.body.appendChild(progressDiv);

        try {
          const success = await downloadImagesAsZip(
            data.images.map((img: any) => ({
              url: img.url,
              filename: img.filename,
            })),
            `gallery-images-${Date.now()}.zip`,
            (current, total, currentFile) => {
              const progressText = document.getElementById('progress-text');
              if (progressText) {
                if (currentFile === 'Generating ZIP file...') {
                  progressText.textContent = currentFile;
                } else {
                  progressText.textContent = `${current + 1}/${total}: ${currentFile}`;
                }
              }
            }
          );

          document.body.removeChild(progressDiv);

          if (success) {
            alert('ZIP file downloaded successfully!');
          } else {
            alert('Failed to download some images. Please try again.');
          }
        } catch (error) {
          document.body.removeChild(progressDiv);
          throw error;
        }
      }
    } catch (error) {
      console.error('Download all failed:', error);
      alert('Failed to download images');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Upload Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Upload Images</h2>
            </div>

            <div className="space-y-3">
              <label className="block">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer">
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <svg className="animate-spin h-10 w-10 text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm text-gray-600 font-medium">Processing images...</p>
                      {uploadProgress.total > 0 && (
                        <>
                          <p className="text-sm text-indigo-600 mt-2">
                            {uploadProgress.current} / {uploadProgress.total} files
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                            ></div>
                          </div>
                        </>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Optimizing large images with high quality (95%)...</p>
                    </div>
                  ) : (
                    <>
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600 mb-1">Click to select images</p>
                      <p className="text-xs text-gray-500">Select multiple images (up to 10GB total)</p>
                    </>
                  )}
                </div>
              </label>

              <label className="block">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="folder-upload"
                  {...({ webkitdirectory: '', directory: '' } as any)}
                />
                <button
                  onClick={() => document.getElementById('folder-upload')?.click()}
                  disabled={uploading}
                  className="w-full py-2 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>Or Upload Entire Folder</span>
                </button>
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-600">{images.length} images uploaded</span>
              {images.length > 0 && (
                <span className="text-green-600 font-medium">✓ Ready to share</span>
              )}
            </div>
          </div>

          {/* Generate OTP Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Client Access</h2>
            </div>

            <button
              onClick={generateOTP}
              disabled={images.length === 0}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Generate OTP & Link</span>
            </button>

            {images.length === 0 && (
              <p className="mt-3 text-sm text-gray-500 text-center">Upload images first to generate access</p>
            )}
            <p className="mt-3 text-xs text-gray-500 text-center">Multiple clients can use the same OTP</p>
          </div>
        </div>

        {/* Images Grid */}
        {images.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Uploaded Images ({images.length})</h2>
              <button
                onClick={downloadAllImages}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download All</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((img) => (
                <div key={img._id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  {img.thumbUrl ? (
                    <img
                      src={img.thumbUrl}
                      alt={img.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onLoad={(e) => {
                        console.log('Image loaded:', img.filename);
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', img.filename, img.thumbUrl);
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.parentElement?.querySelector('.placeholder');
                        if (placeholder) {
                          placeholder.classList.remove('hidden');
                        }
                      }}
                    />
                  ) : null}
                  <div className="placeholder w-full h-full bg-gray-100 flex flex-col items-center justify-center p-2 hidden">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500 text-center">{img.filename}</p>
                  </div>
                  <button
                    onClick={() => deleteImage(img._id)}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {img.filename}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clients Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Client Selections ({clients.length})</h2>
          </div>

          {clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-gray-600">No clients have accessed this gallery yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div key={client._id} className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-indigo-600">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{client.name}</h3>
                        <p className="text-sm text-gray-600">{client.phone}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-500">
                            <span className="font-medium text-indigo-600">{client.selectionsCount}</span> images selected
                          </span>
                          {client.downloadGranted && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Download Granted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewClientSelections(client)}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded-xl transition-colors"
                      >
                        View Selections
                      </button>
                      <button
                        onClick={() => grantDownload(client._id)}
                        disabled={client.downloadGranted}
                        className={`px-6 py-2 rounded-xl font-medium transition-all ${client.downloadGranted
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                          }`}
                      >
                        {client.downloadGranted ? '✓ Access Granted' : 'Grant Download'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Access Created!</h3>
              <p className="text-gray-600">Share these details with your clients</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">OTP Code</label>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-mono font-bold text-indigo-600">{otp}</span>
                  <button
                    onClick={() => copyToClipboard(otp)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">Client Link</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={clientLink}
                    readOnly
                    className="flex-1 text-sm bg-white border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <button
                    onClick={() => copyToClipboard(clientLink)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {copied && (
                <div className="text-center text-sm text-green-600 font-medium">
                  ✓ Copied to clipboard!
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  const message = `🎨 *Your Gallery is Ready!*\n\n📸 View and select your favorite images:\n${clientLink}\n\n🔐 *Access Code:* ${otp}\n\nSimply enter your name, phone number, and the access code to view your gallery.\n\nValid for 7 days.`;
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>Share via WhatsApp</span>
              </button>

              <button
                onClick={() => setShowOTPModal(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Selections Modal */}
      {showImagesModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedClient.name}'s Selections</h3>
                <p className="text-gray-600">{selectedClient.selectionsCount} images selected</p>
              </div>
              <div className="flex items-center space-x-2">
                {selectedClient.selections && selectedClient.selections.length > 0 && (
                  <button
                    onClick={() => downloadClientSelections(selectedClient)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download All</span>
                  </button>
                )}
                <button
                  onClick={() => setShowImagesModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {selectedClient.selections && selectedClient.selections.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedClient.selections.map((img: any) => (
                  <div key={img._id} className="relative aspect-square rounded-lg overflow-hidden border-2 border-indigo-200 bg-gray-100">
                    {img.thumbUrl ? (
                      <img
                        src={img.thumbUrl}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 truncate">
                      {img.filename}
                    </div>
                    <div className="absolute top-2 right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No images selected yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
