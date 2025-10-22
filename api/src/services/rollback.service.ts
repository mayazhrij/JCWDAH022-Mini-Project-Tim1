// services/rollback.service.ts

import { PrismaClient, TransactionStatus } from '../../generated/prisma';

const prisma = new PrismaClient();

/**
 * Fungsi untuk mengembalikan kuota dan poin saat transaksi dibatalkan/expired/rejected.
 * @param transactionId ID Transaksi yang dibatalkan
 */
export const rollbackTransaction = async (transactionId: string) => {
    
    // Gunakan Prisma Transaction untuk menjamin atomisitas rollback
    await prisma.$transaction(async (tx) => {
        
        // Ambil data transaksi, kuota, dan penggunaan poin
        const transaction = await tx.transaction.findUnique({
            where: { id: transactionId },
            include: { pointsUsage: true, ticketType: { include: { event: true } } } 
        });
        
        if (!transaction) return;

        // 1. Rollback Kuota (Seat Restoration)
        if (transaction.ticketType) {
            await tx.ticketType.update({
                where: { id: transaction.ticketTypeId },
                data: { quota: { increment: transaction.quantity } } // Tambahkan kembali kuota
            });
        }

        // 2. Rollback Kuota Total (EVENTS.AVAILABLE_SEATS)
        if (transaction.ticketType?.event) {
             await tx.event.update({
                 where: { id: transaction.ticketType.event.id },
                 data: { availableSeats: { increment: transaction.quantity } } // Tambahkan kembali kuota total
             });
        }

        // 2. Rollback Poin (Menggunakan Tabel PointsUsage)
        if (transaction.pointsUsage) {
            const userId = transaction.userId;
            const pointsToRestore = transaction.pointsUsage.usedPoints;

            // Tambahkan kembali saldo poin di tabel User
            await tx.user.update({
                where: { id: userId },
                data: { points: { increment: pointsToRestore } }
            });
            
            // Hapus record usage dari tabel PointsUsage
            await tx.pointsUsage.delete({
                where: { transactionId: transactionId } 
            });
        }
        
        console.log(`Rollback sukses untuk Transaksi ID: ${transactionId}`);
    });
};