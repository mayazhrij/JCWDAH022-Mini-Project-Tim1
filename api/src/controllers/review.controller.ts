// controllers/review.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, TransactionStatus } from '../../generated/prisma'; 
import { AuthRequest } from '../types/auth'; // Import AuthRequest
import { updateOrganizerRating } from '../services/review.service';

const prisma = new PrismaClient();

// Interface input review (asumsi ada di types/review.ts)
interface ReviewBody {
    eventId: string;
    rating: number; 
    comment?: string;
}

/**
 * @route POST /reviews
 * @desc Customer memberikan review dan rating (Hanya jika status transaksi DONE).
 * @access Private/Customer
 */
export const createReview = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const userId = req.user!.userId;
    const { eventId, rating, comment } = req.body as ReviewBody;

    // 1. Validasi Input
    if (rating < 1 || rating > 5 || !eventId) {
        return res.status(400).json({ message: "Rating (1-5) dan Event ID wajib diisi." });
    }

    try {
        // 2. Cek Telah Hadir (Status DONE)
        const attendedTransaction = await prisma.transaction.findFirst({
            where: {
                userId: userId,
                eventId: eventId,
                status: TransactionStatus.done, // Wajib status DONE
            },
            // Perlu event untuk menghitung rating organizer
            include: { event: { select: { organizerId: true } } } 
        });

        if (!attendedTransaction) {
            return res.status(403).json({ message: "Akses terlarang. Anda hanya bisa memberikan review untuk event yang status transaksinya 'DONE' (telah hadir)." });
        }
        
        // 3. Cek Sudah Pernah Review (Mengatasi unique constraint yang hilang di schema)
        const existingReview = await prisma.review.findFirst({
            where: { userId: userId, eventId: eventId }
        });
        
        if (existingReview) {
            return res.status(409).json({ message: "Anda sudah memberikan review untuk event ini." });
        }


        // 4. Buat Record Review (Prisma Transaction tidak diperlukan karena tidak ada pengurangan kuota/poin)
        const newReview = await prisma.review.create({
            data: {
                userId: userId,
                eventId: eventId,
                rating: rating,
                comment: comment,
            }
        });

        // 5. Update Rating Organizer (Logic Rating)
        const organizerId = attendedTransaction.event.organizerId;
        await updateOrganizerRating(organizerId); 
        

        return res.status(201).json({ message: "Review berhasil disimpan dan rating organizer diperbarui.", review: newReview });

    } catch (error) {
        console.error("Error creating review:", error);
        return res.status(500).json({ message: "Gagal memproses review." });
    }
};