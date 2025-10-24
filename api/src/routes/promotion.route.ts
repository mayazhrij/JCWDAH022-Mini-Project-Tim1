import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth1.middleware';
import { createPromotion } from '../controllers/event.controller';
import { Role } from '../../generated/prisma'; 
import { getActivePromotions } from '../controllers/event.controller';

const router = Router();

router.get('/active', getActivePromotions);

router.post(
    '/', 
    authenticate, 
    authorize(Role.organizer), 
    createPromotion
);

export default router;