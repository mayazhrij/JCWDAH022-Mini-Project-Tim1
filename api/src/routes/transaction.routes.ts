// routes/transaction.routes.ts

import { Router, Response } from 'express';
import { authenticate, authorize } from '../middlewares/auth1.middleware';
import { AuthRequest } from '../types/auth';
import { getTransactionsByUser } from '../controllers/transaction.controller';
import { createTransaction, uploadPaymentProof, confirmTransaction } from '../controllers/transaction.controller'; 
import { Role } from '../../generated/prisma'; 

import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

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
    '/:id/payment-proof', 
    authenticate, 
    upload.single('paymentFile'), 
    uploadPaymentProof
);

// POST /transactions/:id/confirm - Konfirmasi oleh Organizer
router.post(
    '/:id/confirm', 
    authenticate, 
    authorize(Role.organizer),
    confirmTransaction
);

export default router;