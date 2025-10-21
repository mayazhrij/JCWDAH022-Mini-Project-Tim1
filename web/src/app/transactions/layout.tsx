"use client";

import { useAuthStatus } from '@/hooks/useAuthStatus'; 
import { useRouter } from 'next/navigation';
import { Spinner } from 'flowbite-react';
import React, { useEffect } from 'react'; 

export default function TransactionsLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStatus();
    const router = useRouter();
    
    const tokenExists = typeof window !== 'undefined' && localStorage.getItem('jwt_token') !== null;
    
    // --- LOGIC REDIRECT DI useEffect (Side Effect) ---
    useEffect(() => {
        // Cek Token Invalid/Hilang
        if (!isAuthenticated && !tokenExists) {
            router.push('/login');
        }
        
        // Cek Token Invalid (Jika token ada tapi otentikasi gagal)
        if (!isAuthenticated && tokenExists) {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_role');
            router.push('/login');
        }

    }, [isAuthenticated, tokenExists, router]);
    // -----------------------------------------------------------

    // --- LOGIC RENDERING ---
    
    // 1. Kasus Loading/Verifikasi Awal
    if (!isAuthenticated) {
        return <div className="text-center p-20"><Spinner size="xl" /><p>Memverifikasi sesi...</p></div>;
    }
    
    // 2. Render anak-anak jika otentikasi sukses
    return <>{children}</>;
}

