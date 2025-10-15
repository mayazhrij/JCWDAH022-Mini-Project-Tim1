// middlewares/auth.middleware.ts

import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthRequest, TokenPayload } from '../types/auth'; // Import custom types
import { Role } from '../../generated/prisma';

// Ambil JWT Secret dari environment (pastikan sudah diset di .env)
const AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET || 'default_secret_ganti_di_env'; 

/**
 * Middleware untuk memverifikasi JWT dari Header 'Authorization'.
 * Jika token valid, user payload (userId, role) dilampirkan ke req.user
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Cek keberadaan token di header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            message: "Akses ditolak. Token tidak ditemukan atau format tidak valid." 
        });
    }

    // Ambil token (hapus "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // 2. Verifikasi token
        // jwt.verify akan melempar error jika token kadaluarsa atau tidak valid
        const decoded = jwt.verify(token, AUTH_JWT_SECRET) as TokenPayload;

        // 3. Melampirkan payload user ke request
        req.user = decoded; 

        // 4. Lanjutkan ke middleware/controller berikutnya
        next();

    } catch (error) {
        // Menangani error verifikasi (misal: token expired, signature invalid)
        return res.status(401).json({ 
            message: "Token tidak valid atau kadaluarsa." 
        });
    }
};

/**
 * Fungsi pembangun middleware untuk memverifikasi role pengguna.
 * @param requiredRole Role yang dibutuhkan untuk mengakses endpoint (e.g., 'organizer')
 */
export const authorize = (requiredRole: Role) => {
    
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        // WAJIB: Middleware ini harus dijalankan SETELAH middleware 'authenticate'
        if (!req.user) {
             // Seharusnya tidak terjadi jika authenticate sudah berjalan
            return res.status(500).json({ message: "Kesalahan otentikasi internal." });
        }

        // 1. Cek apakah role user sesuai dengan role yang dibutuhkan
        if (req.user.role !== requiredRole) {
            return res.status(403).json({ 
                message: `Akses terlarang. Hanya ${requiredRole} yang diizinkan.` 
            }); // 403 Forbidden
        }

        // 2. Role sesuai, lanjutkan
        next();
    };
};
