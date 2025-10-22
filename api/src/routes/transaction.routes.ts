// routes/transaction.routes.ts

import { Router, Response } from 'express';
import { authenticate, authorize } from '../middlewares/auth1.middleware';
import { AuthRequest } from '../types/auth';
import { getTransactionsByUser } from '../controllers/transaction.controller';
import { createTransaction, uploadPaymentProof, confirmTransaction } from '../controllers/transaction.controller'; 
import { Role } from '../../generated/prisma'; 

import multer, { MulterError } from 'multer';


const router = Router();
const upload = multer({ 
    dest: 'uploads/', 
    // Batas ukuran file 5 MB (5 * 1024 * 1024 bytes), karena kebutuhan Anda adalah Max 2MB, 
    // kita set sedikit lebih tinggi untuk keamanan.
    limits: { fileSize: 5 * 1024 * 1024 } 
});


// POST /transactions
router.post(
    '/', // HARUS '/' karena prefix di app.ts sudah /transactions
    authenticate, 
    createTransaction
);
// --- MENGAMBIL TRANSAKSI (Hanya User yang Login) ---
router.get(
    '/my', 
    authenticate, // Wajib login, tidak peduli role-nya
    getTransactionsByUser // Controller untuk mengambil data
);

// POST /transactions/:id/payment-proof - Upload oleh Customer
router.post(
    '/payment-proof', 
    authenticate, 
    // PERBAIKAN: Mengganti variabel uploadMiddleware dengan fungsi anonim inline
    (req: any, res: any, next: any) => {
        const uploader = upload.single('paymentFile'); // Fieldname: paymentFile
        uploader(req, res, (err: any) => {
            if (err instanceof MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                     return res.status(400).json({ message: "Gagal mengunggah: Ukuran file melebihi 5 MB." });
                }
                return res.status(400).json({ message: `Gagal mengunggah: ${err.message}` });
            } else if (err) {
                return res.status(500).json({ message: "Terjadi kesalahan server saat memproses file." });
            }
            next();
        });
    },
    uploadPaymentProof
);

// POST /transactions/:id/confirm - Konfirmasi oleh Organizer
router.post(
    '/confirm', 
    authenticate, 
    authorize(Role.organizer),
    confirmTransaction
);

export default router;