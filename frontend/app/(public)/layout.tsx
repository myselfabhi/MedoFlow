import Link from 'next/link';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-semibold text-primary-600">
            Medoflow
          </Link>
          <nav className="flex gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/register" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Register
            </Link>
          </nav>
        </div>
      </header>
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
