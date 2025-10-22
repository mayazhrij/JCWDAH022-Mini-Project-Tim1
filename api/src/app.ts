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
import { startTransactionWorker } from './services/worker.service';
import userRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.route';

// --- MIDDLEWARES GLOBAL ---
app.use((req, res, next) => {
    // Logika debugging/parsing body hanya boleh berjalan pada POST, PUT, PATCH
    if (req.method === 'GET' || req.method === 'HEAD') {
        return next(); // --- SOLUSI: Abaikan GET/HEAD dan langsung lanjutkan ---
    }
    
    // Logic untuk menangani data stream (yang Anda tambahkan untuk debugging req.body)
    if (req.headers['content-type'] === 'application/json' && req.body === undefined) {
        let data = '';
        req.on('data', chunk => {
            data += chunk.toString();
        });
        req.on('end', () => {
            try {
                (req as any).body = JSON.parse(data);
                console.log("DEBUG -- MANUAL JSON PARSING SUKSES --");
                next();
            } catch (e) {
                console.error("DEBUG -- MANUAL JSON PARSING GAGAL --", e);
                // Jika gagal parse (terjadi saat body kosong), kita panggil next() agar tidak hang
                next(); 
            }
        });
    } else {
        next();
    }
});
// -----------------------------------------------------------------------
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- DEKLARASI ROUTE API UTAMA --- 
app.use('/auth', authRoutes);
app.use('/events', eventRoutes); 
app.use('/transactions', transactionRoutes);
app.use('/promotions', promotionRoutes);
app.use('/reviews', reviewRoutes);
app.use('/profile', profileRoutes);
app.use('/uploads', express.static(path.join(__dirname, "../uploads")));
app.use('/users', userRoutes);
app.use('/dashboard', dashboardRoutes);
app.use(express.json({ limit: '10mb' }));             
// Batas payload untuk URL encoded data (penting untuk form data)
app.use(express.urlencoded({ limit: '10mb', extended: true }))


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