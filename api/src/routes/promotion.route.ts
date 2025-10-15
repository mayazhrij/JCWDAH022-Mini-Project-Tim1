// routes/promotion.routes.ts

import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth1.middleware';
import { createPromotion } from '../controllers/event.controller'; // Gunakan controller event
import { Role } from '../../generated/prisma'; 
import { getActivePromotions } from '../controllers/event.controller';

const router = Router();

router.get('/active', getActivePromotions);

// POST /promotions (Hanya Organizer)
router.post(
    '/', 
    authenticate, 
    authorize(Role.organizer), 
    createPromotion
);

// TODO: Tambahkan GET /:eventId untuk organizer melihat daftar vouchernya

export default router;