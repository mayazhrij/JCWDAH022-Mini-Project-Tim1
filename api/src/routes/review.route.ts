// routes/review.routes.ts

import { Router } from 'express';
import { authenticate } from '../middlewares/auth1.middleware';
import { createReview, getReviewStatus } from '../controllers/review.controller'; // Asumsi controller baru

const router = Router();

// GET /reviews/status (Cek status kehadiran)
router.get(
    '/status', 
    authenticate, 
    getReviewStatus // <-- Route baru
);

// POST /reviews
router.post(
    '/', 
    authenticate, 
    createReview
);



export default router;