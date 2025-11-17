'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TrashPage() {
  const [folders, setFolders] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'folders' | 'images'>('folders');
  const router = useRouter();

  useEffect(() => {
    loadTrash();
  }, [activeTab]);

  const loadTrash = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'folders') {
        const res = await fetch('/api/admin/trash/folders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFolders(data.folders);
        }
      } else {
        const res = await fetch('/api/admin/trash/images', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setImages(data.images);
        }
      }
    } catch (error) {
      console.error('Failed to load trash:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreFolder = async (folderId: string) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/folders/${folderId}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        loadTrash();
      }
    } catch (error) {
      console.error('Failed to restore folder:', error);
    }
  };

  const permanentlyDeleteFolder = async (folderId: string) => {
    if (!confirm('Permanently delete this gallery? This action cannot be undone and will delete all images from Cloudinary.')) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/folders/${folderId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permanent: true }),
      });

      if (res.ok) {
        loadTrash();
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const permanentlyDeleteImage = async (imageId: string) => {
    if (!confirm('Permanently delete this image? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/images/${imageId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permanent: true }),
      });

      if (res.ok) {
        loadTrash();
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const emptyTrash = async () => {
    if (!confirm('Empty entire trash? This will permanently delete all items and cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('adminToken');

    try {
      // Delete all folders
      for (const folder of folders) {
        await fetch(`/api/admin/folders/${folder._id}/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ permanent: true }),
        });
      }

      // Delete all images
      for (const image of images) {
        await fetch(`/api/admin/images/${image._id}/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ permanent: true }),
        });
      }

      loadTrash();
    } catch (error) {
      console.error('Failed to empty trash:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Trash</h1>
                  <p className="text-sm text-gray-600">Deleted items</p>
                </div>
              </div>
            </div>
            {(folders.length > 0 || images.length > 0) && (
              <button
                onClick={emptyTrash}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
              >
                Empty Trash
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('folders')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'folders'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Galleries ({folders.length})
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'images'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Images ({images.length})
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : activeTab === 'folders' ? (
              folders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No deleted galleries</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {folders.map((folder) => (
                    <div key={folder._id} className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{folder.name}</h3>
                          <p className="text-sm text-gray-600">
                            Deleted {new Date(folder.deletedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => restoreFolder(folder._id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => permanentlyDeleteFolder(folder._id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
                          >
                            Delete Forever
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              images.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No deleted images</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {images.map((img) => (
                    <div key={img._id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-600 truncate">{img.filename}</p>
                        <button
                          onClick={() => permanentlyDeleteImage(img._id)}
                          className="w-full py-1 px-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                        >
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
