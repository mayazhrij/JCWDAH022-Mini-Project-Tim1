import { PrismaClient, TransactionStatus } from '../../generated/prisma';
import { schedule } from 'node-cron';
import { rollbackTransaction } from './rollback.service';

const prisma = new PrismaClient();
const EXPIRY_TIME_MS = 2 * 60 * 60 * 1000; // 2 jam
const CANCEL_TIME_MS = 3 * 24 * 60 * 60 * 1000; // 3 hari

const checkTransactionExpiry = async () => {
    const now = Date.now();
    const twoHoursAgo = new Date(now - EXPIRY_TIME_MS);
    const expiredPayments = await prisma.transaction.findMany({
        where: {
            status: TransactionStatus.waiting_payment,
            createdAt: { lte: twoHoursAgo } 
        }
    });

    for (const transaction of expiredPayments) {
        console.log(`[WORKER]: Memproses kadaluarsa 2 jam untuk Transaksi ID: ${transaction.id}`);
        await rollbackTransaction(transaction.id); 
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.expired }
        });
    }

    const threeDaysAgo = new Date(now - CANCEL_TIME_MS);
    const canceledConfirmations = await prisma.transaction.findMany({
        where: {
            status: TransactionStatus.waiting_confirmation,
            createdAt: { lte: threeDaysAgo } 
        }
    });

    for (const transaction of canceledConfirmations) {
        console.log(`[WORKER]: Memproses pembatalan 3 hari untuk Transaksi ID: ${transaction.id}`);
        
        await rollbackTransaction(transaction.id); 
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.canceled }
        });
    }
};

export const startTransactionWorker = () => {
    schedule('*/5 * * * *', () => { 
        console.log('--- RUNNING TRANSACTION EXPIRY CHECK ---');
        checkTransactionExpiry();
    });
};