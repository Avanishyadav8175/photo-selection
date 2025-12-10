'use client';

import { downloadImagesAsZip, downloadSingleImage } from '@/lib/imageDownloader';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function ClientGallery() {
  const params = useParams();
  const [step, setStep] = useState<'otp' | 'gallery' | 'download'>('otp');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [clientToken, setClientToken] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [selections, setSelections] = useState<Set<string>>(new Set());
  const [downloads, setDownloads] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/client/validate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken: params.token, name, phone, otp }),
      });

      if (!res.ok) throw new Error('Invalid OTP');

      const data = await res.json();
      setClientToken(data.clientToken);
      setStep('gallery');
      loadImages(data.clientToken);
      loadSelections(data.clientToken);
    } catch (err) {
      setError('Invalid OTP or expired link. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async (token: string) => {
    const res = await fetch(`/api/client/${token}/images`);
    if (res.ok) {
      const data = await res.json();
      setImages(data.images);
    }
  };

  const loadSelections = async (token: string) => {
    const res = await fetch(`/api/client/${token}/selections`);
    if (res.ok) {
      const data = await res.json();
      setSelections(new Set(data.selections));
    }
  };

  const toggleSelection = async (imageId: string) => {
    await fetch(`/api/client/${clientToken}/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId }),
    });

    setSelections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const checkDownloads = async () => {
    const res = await fetch(`/api/client/${clientToken}/downloads`);
    if (res.ok) {
      const data = await res.json();
      setDownloads(data.downloads);
      setStep('download');
    } else {
      alert('Download access not granted yet. Please wait for approval.');
    }
  };

  const downloadAllImages = async () => {
    if (downloads.length === 0) return;

    const confirmed = confirm(`Download all ${downloads.length} images as a ZIP file?`);
    if (!confirmed) return;

    // Show progress dialog
    const progressDiv = document.createElement('div');
    progressDiv.id = 'download-progress';
    progressDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:9999;min-width:300px;text-align:center;';
    progressDiv.innerHTML = '<div style="font-size:16px;font-weight:600;margin-bottom:10px;">Downloading images...</div><div id="progress-text" style="color:#666;font-size:14px;">Starting...</div>';
    document.body.appendChild(progressDiv);

    try {
      const success = await downloadImagesAsZip(
        downloads.map((dl: any) => ({
          url: dl.downloadUrl,
          filename: dl.filename,
        })),
        `selected-images-${Date.now()}.zip`,
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
      if (document.getElementById('download-progress')) {
        document.body.removeChild(progressDiv);
      }
      console.error('Failed to create ZIP:', error);
      alert('Failed to create ZIP file. Please try again.');
    }
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h1>
            <p className="text-gray-600">Enter your details to view your gallery</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleOTPSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter Your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Code (OTP)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Access Gallery</span>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>🔒 Your selections are private and secure</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'gallery') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Your Gallery</h1>
                <p className="text-sm text-gray-600">Select your favorite images</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-purple-700">
                    {selections.size} selected
                  </span>
                </div>
                <button
                  onClick={checkDownloads}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Check Downloads
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {images.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600">No images available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {images.map((img) => (
                <div
                  key={img._id}
                  className="group relative aspect-square cursor-pointer prevent-context overflow-hidden rounded-xl"
                  onClick={() => toggleSelection(img._id)}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <img
                    src={img.thumbUrl}
                    alt={img.filename}
                    className="w-full h-full object-cover no-select transition-transform duration-300 group-hover:scale-110"
                    draggable={false}
                  />

                  {/* Overlay */}
                  <div className={`absolute inset-0 transition-all duration-300 ${selections.has(img._id)
                    ? 'bg-purple-600 bg-opacity-40'
                    : 'bg-black bg-opacity-0 group-hover:bg-opacity-20'
                    }`}>
                    {/* Checkmark */}
                    <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${selections.has(img._id)
                      ? 'bg-white scale-100'
                      : 'bg-white bg-opacity-50 scale-0 group-hover:scale-100'
                      }`}>
                      {selections.has(img._id) ? (
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-400 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Tap images to select • Downloads available after approval</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Download Your Images</h1>
            <p className="text-gray-600">Your selected images are ready for download</p>
          </div>

          {downloads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Waiting for Approval</h3>
              <p className="text-gray-600">The photographer will grant download access soon</p>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <button
                  onClick={downloadAllImages}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download All ({downloads.length})</span>
                </button>
              </div>
              <div className="space-y-3">
                {downloads.map((dl) => (
                  <div key={dl.imageId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900">{dl.filename}</span>
                    </div>
                    <button
                      onClick={async () => {
                        const success = await downloadSingleImage(dl.downloadUrl, dl.filename);
                        if (!success) {
                          alert(`Failed to download ${dl.filename}. Please try again.`);
                        }
                      }}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
