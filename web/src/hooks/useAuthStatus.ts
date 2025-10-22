import { useState, useEffect } from 'react';

interface AuthStatus {
    isAuthenticated: boolean;
    role: 'customer' | 'organizer' | null;
    userId: string | null;
    // isLoading: true hanya saat SSR atau awal mount, kemudian disetel false
    isLoading: boolean; 
    // isInitialLoadComplete: true menandakan hook sudah selesai membaca localStorage
    isInitialLoadComplete: boolean; 
}

// Fungsi helper untuk mendapatkan status awal secara SYNCHRONOUS
const getInitialStatus = (): AuthStatus => {
    // 1. Jika kode berjalan di server (SSR), kembalikan state paling NETRAL
    if (typeof window === 'undefined') {
        // Server tidak bisa membaca localStorage, jadi kita asumsikan sedang loading
        return { isAuthenticated: false, role: null, userId: null, isLoading: true, isInitialLoadComplete: false };
    }
    
    // 2. Jika kode berjalan di client, baca localStorage
    const token = localStorage.getItem('jwt_token');
    const userRole = localStorage.getItem('user_role') as 'customer' | 'organizer' | null;

    if (token && userRole) {
        // Client Side: Token ada. Anggap authenticated agar rendering UI sesuai.
        return { 
            isAuthenticated: true, 
            role: userRole, 
            userId: 'client_temp_id', 
            isLoading: false, // Loading selesai
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
    // 1. Ambil status awal SYNCHRONOUS (menghilangkan Hydration Mismatch)
    const [status, setStatus] = useState<AuthStatus>(getInitialStatus());

    // 2. Gunakan useEffect untuk LOGIC ASINKRONUS (Memperbaiki state SSR yang salah)
    useEffect(() => {
        // Jika hook belum selesai loading (kondisi SSR), perbaiki state di client
        if (!status.isInitialLoadComplete) {
             const clientStatus = getInitialStatus();
             // Memperbaiki state SSR yang salah menjadi state client yang benar
             setStatus({ ...clientStatus, isLoading: false, isInitialLoadComplete: true });
        }
        
        // Catatan: Jika Anda ingin memvalidasi token kadaluarsa ke backend, logic asinkronnya masuk di sini
        // Tapi untuk MVP sederhana, kita biarkan logicnya synchronous.

    }, [status.isInitialLoadComplete]); 

    return status;
};

