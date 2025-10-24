import { Request, Response } from 'express';
import { PrismaClient, TransactionStatus } from '../../generated/prisma'; 
import { AuthRequest } from '../types/auth'; // Import AuthRequest
import { updateOrganizerRating } from '../services/review.service';

const prisma = new PrismaClient();

interface ReviewBody {
    eventId: string;
    rating: number; 
    comment?: string;
}

export const createReview = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const userId = req.user!.userId;
    const { eventId, rating, comment } = req.body as ReviewBody;

    // 1. Validasi Input
    if (rating < 1 || rating > 5 || !eventId) {
        return res.status(400).json({ message: "Rating (1-5) dan Event ID wajib diisi." });
    }

    try {
        const attendedTransaction = await prisma.transaction.findFirst({
            where: {
                userId: userId,
                eventId: eventId,
                status: TransactionStatus.done,
            },

            include: { event: { select: { organizerId: true } } } 
        });

        if (!attendedTransaction) {
            return res.status(403).json({ message: "Akses terlarang. Anda hanya bisa memberikan review untuk event yang status transaksinya 'DONE' (telah hadir)." });
        }

        const existingReview = await prisma.review.findFirst({
            where: { userId: userId, eventId: eventId }
        });
        
        if (existingReview) {
            return res.status(409).json({ message: "Anda sudah memberikan review untuk event ini." });
        }

        const newReview = await prisma.review.create({
            data: {
                userId: userId,
                eventId: eventId,
                rating: rating,
                comment: comment,
            }
        });

        const organizerId = attendedTransaction.event.organizerId;
        await updateOrganizerRating(organizerId); 
        

        return res.status(201).json({ message: "Review berhasil disimpan dan rating organizer diperbarui.", review: newReview });

    } catch (error) {
        console.error("Error creating review:", error);
        return res.status(500).json({ message: "Gagal memproses review." });
    }
};

export const getReviewStatus = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const userId = req.user!.userId;
    const eventId = req.query.eventId as string;

    if (!eventId) {
        return res.status(400).json({ message: "Event ID wajib diisi." });
    }

    try {
        const doneTransaction = await prisma.transaction.findFirst({
            where: {
                userId: userId,
                eventId: eventId,
                status: TransactionStatus.done,
            },
            select: { id: true }
        });

        const existingReview = await prisma.review.findFirst({
            where: { userId: userId, eventId: eventId },
            select: { id: true }
        });

        let status: 'DONE' | 'PENDING' | 'NOT_FOUND' = 'NOT_FOUND';
        
        if (doneTransaction) {
             status = 'DONE';
        } else {
             const pendingTx = await prisma.transaction.findFirst({
                 where: { userId: userId, eventId: eventId, status: { in: [TransactionStatus.waiting_payment, TransactionStatus.waiting_confirmation] } }
             });
             if (pendingTx) {
                 status = 'PENDING';
             }
        }
        
        return res.status(200).json({
            status: status,
            hasReviewed: !!existingReview
        });

    } catch (error) {
        console.error("Error checking review status:", error);
        return res.status(500).json({ message: "Gagal memeriksa status kehadiran." });
    }
};