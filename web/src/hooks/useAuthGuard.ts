// web/src/hooks/useAuthGuard.ts (Buat file ini)
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStatus } from './useAuthStatus'; 

// Kondisi yang dikembalikan:
interface GuardState {
    isLoading: boolean;
    isAuthorized: boolean;
}

export const useAuthGuard = (): GuardState => {
    const { isAuthenticated } = useAuthStatus();
    const router = useRouter();
    
    // State untuk memblokir rendering awal (menutupi hydration mismatch)
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        
        const tokenExists = localStorage.getItem('jwt_token') !== null;
        
        // Kasus 1: Token ada, tapi hook gagal memvalidasi (Token Invalid/Expired)
        if (isClient && !isAuthenticated && tokenExists) {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_role');
            router.push('/login');
            return; 
        }

        // Kasus 2: Tidak ada token sama sekali (User sudah logout)
        if (isClient && !isAuthenticated && !tokenExists) {
            router.push('/login');
            return;
        }

    }, [isAuthenticated, isClient, router]);
    
    // Anggap loading selesai jika sudah di client DAN isAuthenticated sudah stabil (bukan lagi initial false)
    const isLoading = isClient && !isAuthenticated && localStorage.getItem('jwt_token') !== null;
    
    return { 
        isLoading: isLoading, 
        isAuthorized: isAuthenticated 
    };
};