import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Image Selection App</h1>
        <div className="space-x-4">
          <Link
            href="/admin/login"
            className="px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
