import { Request, Response } from 'express';
import { PrismaClient, TransactionStatus } from '../../generated/prisma'; 
// Import custom types dan service
import { AuthRequest } from '../types/auth'; 
import { CheckoutBody, ConfirmationBody } from '../types/transaction'; 
import { rollbackTransaction } from '../services/rollback.service'; 

const prisma = new PrismaClient();
const EXPIRY_TIME_MS = 2 * 60 * 60 * 1000; // 2 jam untuk kadaluarsa pembayaran

// -----------------------------------------------------------------
// 1. POST /transactions (CREATE CHECKOUT)
// -----------------------------------------------------------------

/**
 * @route POST /transactions
 * @desc Proses checkout (Mengurangi Kuota dan Poin secara Atomis), termasuk Validasi Promosi.
 * @access Private/Customer
 */
export const createTransaction = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const userId = req.user!.userId;
    const { ticketTypeId, quantity, usePoints } = req.body as CheckoutBody;

    try {
        // 1. VALIDASI DAN PENGAMBILAN DATA (Termasuk Data untuk Validasi Promosi)
        const [ticketType, user, activePromotions] = await prisma.$transaction([
            // Ambil detail tiket dan detail Event (priceIdr)
            prisma.ticketType.findUnique({ 
                where: { id: ticketTypeId },
                include: { event: { select: { id: true, priceIdr: true } } } 
            }),
            prisma.user.findUnique({ where: { id: userId } }),
            // Mencari promosi yang saat ini aktif untuk event ini (Waktu Murni)
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

        
        // 2. LOGIKA VALIDASI PROMOSI WAKTU MURNI
        if (activePromotions.length > 0) {
            const normalPrice = ticketType.event.priceIdr;
            // Jika ada promosi aktif, pastikan harga tiket yang dipilih adalah HARGA DISKON
            if (ticketType.ticketPrice >= normalPrice) {
                return res.status(400).json({ 
                    message: "Saat ini sedang ada masa promosi, Anda hanya diperbolehkan membeli tiket dengan harga diskon yang tersedia." 
                });
            }
        }
        
        // 3. LOGIKA POINT USAGE
        const totalPriceRaw = ticketType.ticketPrice * quantity;
        let finalPrice = totalPriceRaw;
        let pointsUsed = 0;
        let deductedAmount = 0;
        
        if (usePoints && user.points > 0) {
            pointsUsed = Math.min(user.points, totalPriceRaw);
            deductedAmount = pointsUsed; 
            finalPrice -= deductedAmount;
        }

        // 4. PRISMA TRANSACTION (ATOMIC OPERATION)
        await prisma.$transaction(async (tx) => {
            
            // A. Mencatat Transaksi
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

            // B. PENGURANGAN KUOTA
            await tx.ticketType.update({
                where: { id: ticketTypeId },
                data: { quota: { decrement: quantity } } 
            });

             // C. PERBAIKAN KRITIS: PENGURANGAN KUOTA TOTAL (EVENTS.AVAILABLE_SEATS)
            await tx.event.update({
                where: { id: ticketType.eventId },
                data: { availableSeats: { decrement: quantity } } // Kurangi kuota total
            });

            // C. Mencatat Penggunaan Poin dan Mengurangi Saldo User
            if (pointsUsed > 0) {
                await tx.pointsUsage.create({ data: { transactionId: transaction.id, usedPoints: pointsUsed, deductedAmount: deductedAmount } });
                await tx.user.update({ where: { id: userId }, data: { points: { decrement: pointsUsed } } });
            }
            return transaction;
        });

        // 5. RESPON SUKSES
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

// -----------------------------------------------------------------
// 2. POST /transactions/:id/payment-proof (UPLOAD BUKTI BAYAR)
// -----------------------------------------------------------------

/**
 * @route POST /transactions/:id/payment-proof
 * @desc Customer mengunggah bukti pembayaran dan mengubah status ke waiting_confirmation.
 * @access Private (Customer)
 */
export const uploadPaymentProof = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    
    // --- PERBAIKAN MUTLAK: Mengambil ID dari req.body (Form Data) ---
    // ID Transaksi harus dikirim sebagai field 'transactionId' di form-data dari frontend.
    const transactionId = (req.body.transactionId as string); 
    // -------------------------------------------------------------

    const userIdFromToken = req.user!.userId; 

    // --- DEBUG KRITIS ---
    console.log(`[DEBUG UPLOAD - FINAL FIX]: 
    - Transaction ID (from Body): ${transactionId} 
    - User ID from Token: ${userIdFromToken}`
    );
    // ----------------------
    
    // Asumsi: path file didapat dari req.file.path setelah Multer
    // NOTE: req.body.paymentProofUrl hanya digunakan jika tidak ada file (untuk debugging non-multer)
    const paymentProofPath = (req as any).file?.path || req.body.paymentProofUrl; 
    
    // Validasi 1: Pastikan ID Transaksi terkirim
    if (!transactionId) {
        // Ini adalah fix final yang seharusnya menangkap error karena frontend gagal mengirim ID di body
         return res.status(400).json({ message: "ID Transaksi hilang dalam Body permintaan." });
    }

    // Validasi 2: Pastikan file terunggah
    if (!paymentProofPath) return res.status(400).json({ message: "Bukti pembayaran wajib diunggah." });

    try {
        
        // 3. Cari Transaksi
        const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });

        if (!transaction) {
            // Error ini akan muncul jika ID salah atau tidak ditemukan di DB
            return res.status(404).json({ message: "Transaksi tidak ditemukan." });
        }
        
        // Cek Otorisasi (Logic yang Gagal sebelumnya)
        if (transaction.userId !== userIdFromToken) {
            console.warn(`[SECURITY FAIL]: User Token ID ${userIdFromToken} does not match DB ID ${transaction.userId}`);
            return res.status(403).json({ message: "Akses ditolak: Transaksi bukan milik Anda." });
        }
        
        // Cek Status
        if (transaction.status !== TransactionStatus.waiting_payment) {
            return res.status(400).json({ message: "Transaksi tidak dalam status menunggu pembayaran." });
        }

        // Logic upload yang sukses
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
// -----------------------------------------------------------------
// 3. POST /transactions/:id/confirm (KONFIRMASI ADMIN)
// -----------------------------------------------------------------

/**
 * @route POST /transactions/:id/confirm
 * @desc Organizer mengkonfirmasi/menolak transaksi (done/rejected).
 * @access Private/Organizer
 */
export const confirmTransaction = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const transactionId = req.params.id;
    const { action } = req.body as ConfirmationBody;
    const organizerId = req.user!.userId; 

    if (action !== 'accept' && action !== 'reject') {
        return res.status(400).json({ message: "Aksi tidak valid. Gunakan 'accept' atau 'reject'." });
    }

    if (!transactionId) {
        // Log ini akan muncul jika req.params.id adalah undefined
        console.error("CRASH FIX: Transaction ID from params is missing.");
        return res.status(400).json({ message: "ID Transaksi wajib ada di URL." });
    }

    try {
        const transaction = await prisma.transaction.findUnique({ 
            where: { id: transactionId },
            // Perlu include event untuk memverifikasi kepemilikan
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
            // PENTING: Panggil logic rollback saat ditolak
            await rollbackTransaction(transactionId); 
        } else {
            newStatus = TransactionStatus.done;
            // TODO: Integrasi Pengiriman Email Notifikasi Acceptance
        }
        
        // Update Status
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

// -----------------------------------------------------------------
// 4. GET /transactions/my (READ TRANSAKSI USER)
// -----------------------------------------------------------------

/**
 * @route GET /transactions/my
 * @desc Mengambil semua transaksi milik user yang sedang login.
 * @access Private (Customer/Organizer)
 */
export const getTransactionsByUser = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId; 

    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: userId, // Filter berdasarkan user yang sedang login
            },
            // Include data terkait untuk frontend
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