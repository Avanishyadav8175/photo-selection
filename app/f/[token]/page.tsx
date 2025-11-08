'use client';

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

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      setError('Invalid OTP or expired link');
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
    }
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6">Access Gallery</h1>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
          <form onSubmit={handleOTPSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'gallery') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white p-4 rounded-lg shadow mb-4 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">Select Images</h1>
              <div className="flex gap-4 items-center">
                <span className="text-sm">{selections.size} selected</span>
                <button
                  onClick={checkDownloads}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Check Downloads
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((img) => (
              <div
                key={img._id}
                className="relative aspect-square cursor-pointer prevent-context"
                onClick={() => toggleSelection(img._id)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <img
                  src={img.thumbUrl}
                  alt={img.filename}
                  className="w-full h-full object-cover rounded-lg no-select"
                  draggable={false}
                />
                {selections.has(img._id) && (
                  <div className="absolute inset-0 bg-indigo-600 bg-opacity-30 rounded-lg flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-6">Download Your Images</h1>
          {downloads.length === 0 ? (
            <p className="text-gray-600">Admin has not granted download access yet.</p>
          ) : (
            <div className="space-y-4">
              {downloads.map((dl) => (
                <div key={dl.imageId} className="flex justify-between items-center p-4 border rounded-lg">
                  <span>{dl.filename}</span>
                  <a
                    href={dl.downloadUrl}
                    download
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
