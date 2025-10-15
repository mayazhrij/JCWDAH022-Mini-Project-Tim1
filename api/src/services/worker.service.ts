// src/services/worker.service.ts

import { PrismaClient, TransactionStatus } from '../../generated/prisma';
import { schedule } from 'node-cron'; // Import scheduler
import { rollbackTransaction } from './rollback.service'; // Import logic rollback

const prisma = new PrismaClient();

// Konstanta waktu dalam milidetik (sesuai requirement)
const EXPIRY_TIME_MS = 2 * 60 * 60 * 1000; // 2 jam
const CANCEL_TIME_MS = 3 * 24 * 60 * 60 * 1000; // 3 hari

/**
 * Worker untuk mengecek transaksi yang sudah kadaluarsa (Expired 2 jam) dan dibatalkan (Canceled 3 hari).
 */
const checkTransactionExpiry = async () => {
    const now = Date.now();
    
    // -----------------------------------------------------
    // 1. Logika Expired 2 Jam (waiting_payment)
    // -----------------------------------------------------
    const twoHoursAgo = new Date(now - EXPIRY_TIME_MS);
    
    // Cari transaksi yang statusnya 'waiting_payment' dan sudah melewati batas waktu 2 jam
    const expiredPayments = await prisma.transaction.findMany({
        where: {
            status: TransactionStatus.waiting_payment,
            createdAt: { lte: twoHoursAgo } 
        }
    });

    for (const transaction of expiredPayments) {
        console.log(`[WORKER]: Memproses kadaluarsa 2 jam untuk Transaksi ID: ${transaction.id}`);
        
        // Panggil logic rollback (mengembalikan kuota & poin)
        await rollbackTransaction(transaction.id); 
        
        // Update status menjadi expired
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.expired }
        });
    }


    // -----------------------------------------------------
    // 2. Logika Canceled 3 Hari (waiting_confirmation)
    // -----------------------------------------------------
    const threeDaysAgo = new Date(now - CANCEL_TIME_MS);
    
    // Cari transaksi yang statusnya 'waiting_confirmation' dan sudah melewati batas waktu 3 hari
    const canceledConfirmations = await prisma.transaction.findMany({
        where: {
            status: TransactionStatus.waiting_confirmation,
            createdAt: { lte: threeDaysAgo } 
        }
    });

    for (const transaction of canceledConfirmations) {
        console.log(`[WORKER]: Memproses pembatalan 3 hari untuk Transaksi ID: ${transaction.id}`);
        
        // Panggil logic rollback
        await rollbackTransaction(transaction.id); 
        
        // Update status menjadi canceled
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.canceled }
        });
    }
};

/**
 * Fungsi untuk memulai worker scheduler utama (dipanggil di app.ts).
 */
export const startTransactionWorker = () => {
    // Jadwal: Jalankan pengecekan setiap 5 menit (*/5 * * * *)
    // Catatan: Jadwal dapat diubah sesuai kebutuhan performa
    schedule('*/5 * * * *', () => { 
        console.log('--- RUNNING TRANSACTION EXPIRY CHECK ---');
        checkTransactionExpiry();
    });
};