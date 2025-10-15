// controllers/user.controller.ts (Tambahan)

import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
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