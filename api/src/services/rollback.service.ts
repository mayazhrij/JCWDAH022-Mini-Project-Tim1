// services/rollback.service.ts

import { PrismaClient, TransactionStatus } from '../../generated/prisma';

const prisma = new PrismaClient();

export const rollbackTransaction = async (transactionId: string) => {
    await prisma.$transaction(async (tx) => {
        
        const transaction = await tx.transaction.findUnique({
            where: { id: transactionId },
            include: { pointsUsage: true, ticketType: { include: { event: true } } } 
        });
        
        if (!transaction) return;

        if (transaction.ticketType) {
            await tx.ticketType.update({
                where: { id: transaction.ticketTypeId },
                data: { quota: { increment: transaction.quantity } }
            });
        }

        if (transaction.ticketType?.event) {
             await tx.event.update({
                 where: { id: transaction.ticketType.event.id },
                 data: { availableSeats: { increment: transaction.quantity } }
             });
        }

        if (transaction.pointsUsage) {
            const userId = transaction.userId;
            const pointsToRestore = transaction.pointsUsage.usedPoints;

            await tx.user.update({
                where: { id: userId },
                data: { points: { increment: pointsToRestore } }
            });

            await tx.pointsUsage.delete({
                where: { transactionId: transactionId } 
            });
        }
        
        console.log(`Rollback sukses untuk Transaksi ID: ${transactionId}`);
    });
};