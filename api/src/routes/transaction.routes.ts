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
    limits: { fileSize: 5 * 1024 * 1024 } 
});

router.post(
    '/',
    authenticate, 
    createTransaction
);

router.get(
    '/my', 
    authenticate,
    getTransactionsByUser
);

router.post(
    '/payment-proof', 
    authenticate, 

    (req: any, res: any, next: any) => {
        const uploader = upload.single('paymentFile');
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

router.post(
    '/:id/confirm', 
    authenticate, 
    authorize(Role.organizer),
    confirmTransaction
);

export default router;