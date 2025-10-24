import { Router } from 'express';
import { authenticate } from '../middlewares/auth1.middleware';
import { createReview, getReviewStatus } from '../controllers/review.controller';

const router = Router();

router.get(
    '/status', 
    authenticate, 
    getReviewStatus
);

router.post(
    '/', 
    authenticate, 
    createReview
);



export default router;