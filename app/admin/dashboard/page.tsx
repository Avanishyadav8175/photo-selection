'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [folders, setFolders] = useState<any[]>([]);
  const [folderName, setFolderName] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const res = await fetch('/api/admin/folders', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setFolders(data.folders);
    }
  };

  const createFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');

    const res = await fetch('/api/admin/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: folderName }),
    });

    if (res.ok) {
      setFolderName('');
      loadFolders();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Folder</h2>
          <form onSubmit={createFolder} className="flex gap-4">
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 px-4 py-2 border rounded-lg"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Folders</h2>
          <div className="space-y-4">
            {folders.map((folder) => (
              <div
                key={folder._id}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/admin/folder/${folder._id}`)}
              >
                <h3 className="font-semibold">{folder.name}</h3>
                <p className="text-sm text-gray-600">
                  Status: {folder.status} | Created: {new Date(folder.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
