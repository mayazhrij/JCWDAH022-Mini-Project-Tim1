import { Request, Response } from 'express';
import { PrismaClient, TransactionStatus } from '../../generated/prisma'; 
// Import custom types dan service
import { AuthRequest } from '../types/auth'; 
import { CheckoutBody, ConfirmationBody } from '../types/transaction'; 
import { rollbackTransaction } from '../services/rollback.service'; 

const prisma = new PrismaClient();
const EXPIRY_TIME_MS = 2 * 60 * 60 * 1000;

export const createTransaction = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const userId = req.user!.userId;
    const { ticketTypeId, quantity, usePoints } = req.body as CheckoutBody;

    try {
        const [ticketType, user, activePromotions] = await prisma.$transaction([
            prisma.ticketType.findUnique({ 
                where: { id: ticketTypeId },
                include: { event: { select: { id: true, priceIdr: true } } } 
            }),
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.promotion.findMany({ 
                where: { 
                    event: { ticketTypes: { some: { id: ticketTypeId } } }, 
                    startDate: { lte: new Date() }, 
                    endDate: { gte: new Date() }    
                } 
            })
        ]);

        if (!ticketType || !user) return res.status(404).json({ message: "Data tidak valid (Tiket atau Pengguna tidak ditemukan)." });
        if (ticketType.quota < quantity) return res.status(400).json({ message: `Kuota tiket tidak cukup. Tersisa: ${ticketType.quota}` });

        if (activePromotions.length > 0) {
            const normalPrice = ticketType.event.priceIdr;
            if (ticketType.ticketPrice >= normalPrice) {
                return res.status(400).json({ 
                    message: "Saat ini sedang ada masa promosi, Anda hanya diperbolehkan membeli tiket dengan harga diskon yang tersedia." 
                });
            }
        }

        const totalPriceRaw = ticketType.ticketPrice * quantity;
        let finalPrice = totalPriceRaw;
        let pointsUsed = 0;
        let deductedAmount = 0;
        
        if (usePoints && user.points > 0) {
            pointsUsed = Math.min(user.points, totalPriceRaw);
            deductedAmount = pointsUsed; 
            finalPrice -= deductedAmount;
        }

        await prisma.$transaction(async (tx) => {

            const transaction = await tx.transaction.create({
                data: {
                    userId: userId,
                    eventId: ticketType.eventId,
                    ticketTypeId: ticketTypeId,
                    quantity: quantity,
                    totalPrice: finalPrice,
                    status: TransactionStatus.waiting_payment,
                }
            });

            await tx.ticketType.update({
                where: { id: ticketTypeId },
                data: { quota: { decrement: quantity } } 
            });

            await tx.event.update({
                where: { id: ticketType.eventId },
                data: { availableSeats: { decrement: quantity } }
            });

            if (pointsUsed > 0) {
                await tx.pointsUsage.create({ data: { transactionId: transaction.id, usedPoints: pointsUsed, deductedAmount: deductedAmount } });
                await tx.user.update({ where: { id: userId }, data: { points: { decrement: pointsUsed } } });
            }
            return transaction;
        });

        res.status(201).json({
            message: "Tiket berhasil dipesan. Menunggu pembayaran.",
            totalPrice: finalPrice,
            pointsUsed: pointsUsed,
            countdown: '2 jam',
        });

    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ message: "Gagal memproses transaksi." });
    }
};

export const uploadPaymentProof = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const transactionId = (req.body.transactionId as string); 
    const userIdFromToken = req.user!.userId; 

    console.log(`[DEBUG UPLOAD - FINAL FIX]: 
    - Transaction ID (from Body): ${transactionId} 
    - User ID from Token: ${userIdFromToken}`
    );
    const paymentProofPath = (req as any).file?.path || req.body.paymentProofUrl; 
    
    if (!transactionId) {
         return res.status(400).json({ message: "ID Transaksi hilang dalam Body permintaan." });
    }

    if (!paymentProofPath) return res.status(400).json({ message: "Bukti pembayaran wajib diunggah." });

    try {
        const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });

        if (!transaction) {
            return res.status(404).json({ message: "Transaksi tidak ditemukan." });
        }
        
        if (transaction.userId !== userIdFromToken) {
            console.warn(`[SECURITY FAIL]: User Token ID ${userIdFromToken} does not match DB ID ${transaction.userId}`);
            return res.status(403).json({ message: "Akses ditolak: Transaksi bukan milik Anda." });
        }
        if (transaction.status !== TransactionStatus.waiting_payment) {
            return res.status(400).json({ message: "Transaksi tidak dalam status menunggu pembayaran." });
        }

        await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status: TransactionStatus.waiting_confirmation,
                paymentProof: paymentProofPath,
            }
        });

        return res.status(200).json({ message: "Bukti pembayaran berhasil diunggah. Menunggu konfirmasi organizer." });

    } catch (error) {
       console.error("Error uploading payment proof:", error);
       return res.status(500).json({ message: "Gagal mengunggah bukti pembayaran." });
    }
};

export const confirmTransaction = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const transactionId = req.params.id;
    const { action } = req.body as ConfirmationBody;
    const organizerId = req.user!.userId; 

    if (action !== 'accept' && action !== 'reject') {
        return res.status(400).json({ message: "Aksi tidak valid. Gunakan 'accept' atau 'reject'." });
    }

    if (!transactionId) {
        console.error("CRASH FIX: Transaction ID from params is missing.");
        return res.status(400).json({ message: "ID Transaksi wajib ada di URL." });
    }

    try {
        const transaction = await prisma.transaction.findUnique({ 
            where: { id: transactionId },
            include: { event: { select: { organizerId: true } } } 
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaksi tidak ditemukan." });
        }

        if (!transaction.event) {
             console.error(`[CRASH]: Transaction ${transactionId} has no linked Event.`);
             return res.status(500).json({ message: "Gagal memproses konfirmasi: Data Event Hilang." });
        }

        if (!transaction.event || transaction.event.organizerId !== organizerId) { 
             console.warn(`[SECURITY FAIL]: Organizer ${organizerId} tried to hijack transaction.`);
             return res.status(403).json({ message: "Akses ditolak: Anda bukan organizer event ini." }); 
        }
        
        if (transaction.status !== TransactionStatus.waiting_confirmation) {
            return res.status(400).json({ message: "Transaksi tidak dalam status menunggu konfirmasi." });
        }

        let newStatus: TransactionStatus;
        
        if (action === 'reject') {
            newStatus = TransactionStatus.rejected;
            await rollbackTransaction(transactionId); 
        } else {
            newStatus = TransactionStatus.done;
        }
        await prisma.transaction.update({
            where: { id: transactionId },
            data: { status: newStatus }
        });

        return res.status(200).json({ message: `Transaksi berhasil diubah status menjadi ${newStatus.toUpperCase()}.` });

    } catch (error) {
        console.error("Error confirming transaction:", error);
        return res.status(500).json({ message: "Gagal memproses konfirmasi." });
    }
};

export const getTransactionsByUser = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId; 

    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
            },
            include: {
                event: { select: { name: true, startDate: true, location: true, priceIdr: true } },
                ticketType: { select: { ticketName: true, ticketPrice: true } },
                pointsUsage: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({ data: transactions });

    } catch (error) {
        console.error("Error fetching transactions:", error);
        return res.status(500).json({ message: "Gagal mengambil data transaksi." });
    }
};