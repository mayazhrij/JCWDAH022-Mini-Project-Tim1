// controllers/user.controller.ts (Tambahan)

import { Request, Response } from 'express';
import { PrismaClient, Role } from '../../generated/prisma';
// Import service untuk perhitungan rating (sudah kita buat di Hari ke-5)
import { updateOrganizerRating } from '../services/review.service'; 
import { AuthRequest } from '../types/auth'; // Untuk typing

const prisma = new PrismaClient();

/**
 * @route GET /organizer/:organizerId/profile
 * @desc Mengambil profil, rating rata-rata, dan daftar review dari Organizer.
 * @access Public (Siapa saja boleh melihat profil organizer)
 */
export const getOrganizerRatingAndReviews = async (req: Request, res: Response): Promise<Response | void> => {
    // Ambil ID Organizer dari URL parameter
    const organizerId = req.params.organizerId; 

    try {
        // 1. Ambil Detail Dasar Organizer (dari model User)
        const organizer = await prisma.user.findUnique({
            where: { id: organizerId, role: 'organizer' as any }, // Pastikan role-nya organizer
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                // Tambahkan field profil picture dll jika sudah diimplementasikan
            }
        });

        if (!organizer) {
            return res.status(404).json({ message: "Profil Organizer tidak ditemukan." });
        }
        
        // 2. Hitung Rating Rata-Rata (Logic Agregasi)
        // Kita langsung hitung agregasi rating dari semua event milik organizer ini
        const ratingAggregates = await prisma.review.aggregate({
            _avg: { rating: true },
            _count: { id: true },
            where: { 
                event: { organizerId: organizerId } // Filter berdasarkan event milik organizer
            }
        });

        // 3. Ambil Daftar Reviews Terbaru
        const reviews = await prisma.review.findMany({
            where: { event: { organizerId: organizerId } },
            take: 10, 
            orderBy: { id: 'desc' },
            // Ambil 10 review terbaru
            // Include user yang me-review jika diperlukan
        });

        // 4. Gabungkan Hasil dan Kembalikan
        return res.status(200).json({
            data: {
                profile: organizer,
                ratings: {
                    average: ratingAggregates._avg.rating?.toFixed(2) || '0.00',
                    totalReviews: ratingAggregates._count.id,
                },
                reviews: reviews,
            }
        });

    } catch (error) {
        console.error("Error fetching organizer profile and rating:", error);
        return res.status(500).json({ message: "Gagal mengambil data profil organizer." });
    }
};

export const getMyProfileController = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const userId = req.user!.userId;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                points: true, // KRITIS: Saldo poin
                role: true,
            }
        });

        if (!user) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }
        
        return res.status(200).json({ data: user });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ message: "Gagal memuat profil pengguna." });
    }
};

// Interface input untuk pemberian poin
interface AddPointsBody {
    targetUserId: string; // ID customer yang akan menerima poin
    amount: number;       // Jumlah poin yang diberikan
    reason: string;       // Alasan pemberian poin
}

/**
 * @route POST /users/add-points
 * @desc Memberikan saldo poin kepada user tertentu.
 * @access Private/Organizer (Membutuhkan authorize(Role.organizer))
 */
export const addPoints = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    // Autorisasi sebagai Organizer ditangani oleh middleware di route
    const { targetUserId, amount, reason } = req.body as AddPointsBody;

    if (!targetUserId || !amount || amount <= 0 || !reason) {
        return res.status(400).json({ message: "ID User Target, jumlah poin positif, dan alasan wajib diisi." });
    }
    // Asumsi: Poin kadaluarsa 3 bulan (90 hari) sesuai requirement F2
    const EXPIRY_DAYS = 90; 

    try {
        await prisma.$transaction(async (tx) => {
            
            // 1. Perbarui Saldo Utama di Tabel User (Increment)
            await tx.user.update({
                where: { id: targetUserId },
                data: {
                    points: { increment: amount } 
                }
            });

            // 2. Buat Riwayat di Tabel Point (Jika menggunakan model Point)
            // Karena schema Anda menggunakan model Point untuk riwayat dan User untuk saldo, kita catat riwayatnya.
            // Poin ini harus memiliki tanggal kadaluarsa (3 bulan dari sekarang)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);
            
            await tx.point.create({
                data: {
                    userId: targetUserId,
                    amount: amount,
                    reason: reason,
                    expiresAt: expiryDate,
                    // transactionId akan null karena ini bukan dari transaksi tiket
                }
            });
        });

        return res.status(200).json({ message: `Berhasil memberikan ${amount} poin kepada user ID: ${targetUserId}.` });

    } catch (error) {
        console.error("Error adding points:", error);
        return res.status(500).json({ message: "Gagal memberikan poin." });
    }
};