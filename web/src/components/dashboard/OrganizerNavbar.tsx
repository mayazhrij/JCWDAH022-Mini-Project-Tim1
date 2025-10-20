"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiTicket, HiArrowLeftOnRectangle, HiUser } from 'react-icons/hi2';

export default function OrganizerNavbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <HiTicket className="w-8 h-8 text-purple-600" />
          <span className="text-2xl font-bold text-purple-600">Tickety</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center space-x-6">
          <Link href="/profile" className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition">
            <HiUser className="w-5 h-5" />
            <span>Profile</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition px-4 py-2 bg-red-50 rounded-lg"
          >
            <HiArrowLeftOnRectangle className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}