// web/src/hooks/useAuthStatus.ts (Buat file ini)

import { useState, useEffect } from 'react';

interface AuthStatus {
    isAuthenticated: boolean;
    role: 'customer' | 'organizer' | null;
    userId: string | null;
}

export const useAuthStatus = (): AuthStatus => {
    const [status, setStatus] = useState<AuthStatus>({
        isAuthenticated: false,
        role: null,
        userId: null,
    });

    useEffect(() => {
        // Logika ini berjalan setiap kali komponen dimuat (Client-side)
        const token = localStorage.getItem('jwt_token');
        const userRole = localStorage.getItem('user_role') as 'customer' | 'organizer' | null;

        if (token && userRole) {
            // TODO: Sebaiknya token divalidasi ke backend atau didecode (jika perlu ID user)
            setStatus({
                isAuthenticated: true,
                role: userRole,
                userId: '...' // Ambil ID jika diperlukan
            });
        } else {
            setStatus({ isAuthenticated: false, role: null, userId: null });
        }
    }, []);

    return status;
};