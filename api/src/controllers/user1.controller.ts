import { Request, Response } from 'express';
import { PrismaClient, Role } from '../../generated/prisma';
import { updateOrganizerRating } from '../services/review.service'; 
import { AuthRequest } from '../types/auth';

const prisma = new PrismaClient();

export const getOrganizerRatingAndReviews = async (req: Request, res: Response): Promise<Response | void> => {
    const organizerId = req.params.organizerId; 

    try {
        const organizer = await prisma.user.findUnique({
            where: { id: organizerId, role: 'organizer' as any },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            }
        });

        if (!organizer) {
            return res.status(404).json({ message: "Profil Organizer tidak ditemukan." });
        }

        const ratingAggregates = await prisma.review.aggregate({
            _avg: { rating: true },
            _count: { id: true },
            where: { 
                event: { organizerId: organizerId }
            }
        });

        const reviews = await prisma.review.findMany({
            where: { event: { organizerId: organizerId } },
            take: 10, 
            orderBy: { id: 'desc' },
        });

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
                points: true,
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

interface AddPointsBody {
    targetUserId: string;
    amount: number;
    reason: string;       
}

export const addPoints = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    // Autorisasi sebagai Organizer ditangani oleh middleware di route
    const { targetUserId, amount, reason } = req.body as AddPointsBody;

    if (!targetUserId || !amount || amount <= 0 || !reason) {
        return res.status(400).json({ message: "ID User Target, jumlah poin positif, dan alasan wajib diisi." });
    }
    const EXPIRY_DAYS = 90; 

    try {
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: targetUserId },
                data: {
                    points: { increment: amount } 
                }
            });
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);
            
            await tx.point.create({
                data: {
                    userId: targetUserId,
                    amount: amount,
                    reason: reason,
                    expiresAt: expiryDate,
                }
            });
        });

        return res.status(200).json({ message: `Berhasil memberikan ${amount} poin kepada user ID: ${targetUserId}.` });

    } catch (error) {
        console.error("Error adding points:", error);
        return res.status(500).json({ message: "Gagal memberikan poin." });
    }
};