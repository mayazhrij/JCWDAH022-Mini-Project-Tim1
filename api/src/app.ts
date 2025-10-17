// app.ts

import { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { startExpiryJobs } from './jobs/expire-rewards';
import profileRoutes from './routes/profile.routes';
import path from 'path';

// --- BAGIAN KRITIS: MENGATASI TYPERROR PADA EXPRESS ---
// 1. Gunakan require() dan casting type untuk mendapatkan objek module Express
const express = require('express');
const app: Application = express.default ? express.default() : express();
// --- AKHIR BAGIAN KRITIS ---

// --- KONFIGURASI AWAL ---
dotenv.config(); // Memuat variabel dari .env
const PORT = process.env.PORT || 3000;


// --- IMPORT ROUTES ---
// Sesuaikan path ini dengan struktur folder Anda!
import authRoutes from './routes/auth.routes';  
import eventRoutes from './routes/event.routes';         
import transactionRoutes from './routes/transaction.routes'; 
import promotionRoutes from './routes/promotion.route';
import reviewRoutes from './routes/review.route';
import { startTransactionWorker } from './services/worker.service'


// --- MIDDLEWARE UMUM ---
app.use((req, res, next) => {
    console.log(`[REQUEST]: ${req.method} ${req.url} - Time: ${new Date().toLocaleTimeString()}`);
    next();
});

// --- PERBAIKAN KRITIS: Body Parser Alternatif (Jika express.json Gagal) ---
// Middleware ini WAJIB diuji.
app.use((req, res, next) => {
    // Hanya proses body jika Content-Type adalah JSON dan req.body belum terisi
    if (req.headers['content-type'] === 'application/json' && req.body === undefined) {
        let data = '';
        // Baca data stream dari request (buffer mentah)
        req.on('data', chunk => {
            data += chunk.toString();
        });
        req.on('end', () => {
            try {
                // Coba parse data mentah secara manual
                (req as any).body = JSON.parse(data);
                console.log("DEBUG -- MANUAL JSON PARSING SUKSES --");
                next();
            } catch (e) {
                console.error("DEBUG -- MANUAL JSON PARSING GAGAL --", e);
                // Jika parsing manual gagal, lanjutkan ke middleware Express.json
                next(); 
            }
        });
    } else {
        next();
    }
});
// -----------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- DEKLARASI ROUTE API UTAMA --- 
app.use('/auth', authRoutes);
app.use('/events', eventRoutes); 
app.use('/transactions', transactionRoutes);
app.use('/promotions', promotionRoutes);
app.use('/reviews', reviewRoutes);
app.use('/profile', profileRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));



// --- ROOT ROUTE (Opsional) ---
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ 
        message: 'API Server is Ready!',
        environment: process.env.NODE_ENV || 'development',
    });
});


// --- MENJALANKAN SERVER ---
app.listen(PORT, () => {
    console.log(`[server]: API Server is running at http://localhost:${PORT}`);
    console.log(`[server]: Environment: ${process.env.NODE_ENV || 'development'}`);
    startTransactionWorker();

    startExpiryJobs();
});