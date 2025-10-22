"use client";

import { useAuthStatus } from '@/hooks/useAuthStatus'; 
import { useRouter } from 'next/navigation';
import { Spinner } from 'flowbite-react';
import React, { useEffect } from 'react'; 

// Import komponen utama yang merender tabel
import TransactionFlow from '@/components/TransactionFlow'; 

export default function MyTransactionsPage() {
    // Ambil status dari hook yang sudah disinkronkan
    const { isAuthenticated, isInitialLoadComplete } = useAuthStatus();
    const router = useRouter();
    
    // --- LOGIC REDIRECT DI useEffect (Side Effect) ---
    useEffect(() => {
        // Redirect hanya jika hook selesai membaca state DAN otentikasi gagal.
        if (isInitialLoadComplete && !isAuthenticated) {
            
            // Hapus token kadaluarsa (jika ada) sebelum redirect (cleanup)
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_role');
            
            router.push('/login');
        }
    }, [isAuthenticated, isInitialLoadComplete, router]);

    // --- LOGIC RENDERING UTAMA (GUARD) ---
    
    // 1. KASUS LOADING / VERIFIKASI AWAL
    // Tampilkan loading jika hook belum selesai membaca state awal.
    if (!isInitialLoadComplete) { 
        return <div className="text-center p-20 min-h-screen"><Spinner size="xl" /><p>Memverifikasi sesi...</p></div>;
    }
    
    // 2. KASUS REDIRECT DIPICU (Jika loading selesai dan otentikasi gagal)
    if (!isAuthenticated) { 
        // Redirect sudah dipicu di useEffect. Mengembalikan null untuk menghentikan rendering.
        return null; 
    }
    
    // 3. Render komponen utama jika otentikasi sukses
    // HANYA JALAN JIKA isAuthenticated = true
    return <TransactionFlow />;
}





