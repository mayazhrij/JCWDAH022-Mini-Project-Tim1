import React from 'react';
import { HiTicket } from 'react-icons/hi';

export default function Header() {
  return (
    <header className="bg-purple-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HiTicket className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Tickety</h1>
        </div>
        {/* Tambah menu jika perlu */}
      </div>
    </header>
  );
}