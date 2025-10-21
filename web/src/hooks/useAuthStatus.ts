import { useState, useEffect } from 'react';

interface AuthStatus {
    isAuthenticated: boolean;
    role: 'customer' | 'organizer' | null;
    userId: string | null;
    isLoading: boolean; 
    isInitialLoadComplete: boolean; 
}

// Fungsi helper untuk mendapatkan status awal secara SYNCHRONOUS
const getInitialStatus = (): AuthStatus => {
    // Kita harus memastikan ini hanya dipanggil di browser
    if (typeof window === 'undefined') {
        return { isAuthenticated: false, role: null, userId: null, isLoading: true, isInitialLoadComplete: false };
    }
    
    const token = localStorage.getItem('jwt_token');
    const userRole = localStorage.getItem('user_role') as 'customer' | 'organizer' | null;

    if (token && userRole) {
        return { 
            isAuthenticated: true, 
            role: userRole, 
            userId: 'valid_id', // Placeholder ID
            isLoading: false, 
            isInitialLoadComplete: true 
        };
    }
    
    return { 
        isAuthenticated: false, 
        role: null, 
        userId: null, 
        isLoading: false, 
        isInitialLoadComplete: true 
    };
};

export const useAuthStatus = (): AuthStatus => {
    // 1. Ambil status awal secara SYNCHRONOUS
    const [status, setStatus] = useState<AuthStatus>(getInitialStatus());

    // 2. Gunakan useEffect HANYA untuk memastikan sinkronisasi tambahan (misal, refresh token)
    useEffect(() => {
        // Karena status awal sudah disetel, kita tidak perlu logic initial load yang berat di sini lagi.
        // Logic ini hanya untuk memastikan status tetap terupdate jika ada perubahan lain.
        if (status.isInitialLoadComplete && status.isAuthenticated) {
            // TODO: Tambahkan logic untuk me-refresh token jika diperlukan
        }
    }, [status.isAuthenticated]);

    return status;
};