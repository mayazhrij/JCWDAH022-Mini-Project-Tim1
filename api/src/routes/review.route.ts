// routes/review.routes.ts

import { Router } from 'express';
import { authenticate } from '../middlewares/auth1.middleware';
import { createReview } from '../controllers/review.controller'; // Asumsi controller baru

const router = Router();

// POST /reviews
router.post(
    '/', 
    authenticate, 
    createReview
);

export default router;