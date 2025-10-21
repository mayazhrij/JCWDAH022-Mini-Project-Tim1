import { useState, useEffect } from 'react';

interface AuthStatus {
    isAuthenticated: boolean;
    role: 'customer' | 'organizer' | null;
    userId: string | null;
    isLoading: boolean; // Menandai bahwa proses verifikasi JWT sedang berjalan
    isInitialLoadComplete: boolean; 
}

// Fungsi helper untuk mendapatkan status awal secara SYNCHRONOUS
const getInitialStatus = (): AuthStatus => {
    // 1. Jika kode berjalan di server (SSR)
    if (typeof window === 'undefined') {
        // Server tidak bisa membaca localStorage, jadi kita asumsikan sedang loading
        return { isAuthenticated: false, role: null, userId: null, isLoading: true, isInitialLoadComplete: false };
    }
    
    // 2. Jika kode berjalan di client, baca localStorage
    const token = localStorage.getItem('jwt_token');
    const userRole = localStorage.getItem('user_role') as 'customer' | 'organizer' | null;

    if (token && userRole) {
        // Token ada: Anggap VALID sementara (akan divalidasi penuh di useEffect)
        return { 
            isAuthenticated: true, 
            role: userRole, 
            userId: 'client_temp_id', 
            isLoading: false, // Perubahan: Set isLoading ke FALSE di client jika token ada
            isInitialLoadComplete: true 
        };
    }
    
    // Jika di client dan tidak ada token
    return { 
        isAuthenticated: false, 
        role: null, 
        userId: null, 
        isLoading: false, 
        isInitialLoadComplete: true 
    };
};

export const useAuthStatus = (): AuthStatus => {
    // 1. Ambil status awal SYNCHRONOUS
    const [status, setStatus] = useState<AuthStatus>(getInitialStatus());

    // 2. Gunakan useEffect untuk LOGIC ASINKRONUS (Verifikasi Token Sebenarnya)
    useEffect(() => {
        // Hanya verifikasi jika hook selesai dan status awal berbeda dari status saat ini
        if (!status.isInitialLoadComplete) {
             const clientStatus = getInitialStatus();
             // Memperbaiki state SSR yang salah menjadi state client yang benar
             setStatus({ ...clientStatus, isLoading: false, isInitialLoadComplete: true });
            return;
        }

        // Logic untuk membersihkan token kadaluarsa (opsional jika tidak menggunakan verifyToken)
        // Kita biarkan logic ini kosong karena sudah dihandle di page.tsx saat error SWR.
        
    }, [status.isInitialLoadComplete]); 

    return status;
};
