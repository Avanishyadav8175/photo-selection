'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FolderManagement() {
  const params = useParams();
  const [images, setImages] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [otp, setOtp] = useState('');
  const [clientLink, setClientLink] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadImages();
    loadClients();
  }, []);

  const loadImages = async () => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`/api/admin/folders/${params.id}/images`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
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
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const token = localStorage.getItem('adminToken');

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        await fetch(`/api/admin/folders/${params.id}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    setUploading(false);
    loadImages();
  };

  const grantDownload = async (clientId: string) => {
    const token = localStorage.getItem('adminToken');
    await fetch(`/api/admin/clients/${clientId}/grant-download`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    loadClients();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Folder Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Upload Images</h2>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="mb-4"
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-gray-600">Uploading...</p>}
            <p className="text-sm text-gray-600">{images.length} images uploaded</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Generate OTP</h2>
            <button
              onClick={generateOTP}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 mb-4"
            >
              Generate OTP
            </button>
            {otp && (
              <div className="space-y-2">
                <p className="font-mono text-2xl font-bold">{otp}</p>
                <p className="text-sm break-all">{clientLink}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Clients & Selections</h2>
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client._id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{client.name}</h3>
                    <p className="text-sm text-gray-600">{client.phone}</p>
                    <p className="text-sm">Selected: {client.selectionsCount} images</p>
                  </div>
                  <button
                    onClick={() => grantDownload(client._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    disabled={client.downloadGranted}
                  >
                    {client.downloadGranted ? 'Access Granted' : 'Grant Download'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
