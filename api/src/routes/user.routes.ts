// src/routes/user.routes.ts

import { Router } from 'express';
// Import middleware yang sudah kita buat
import { authenticate, authorize } from '../middlewares/auth1.middleware';
import { addPoints } from '../controllers/user1.controller';
import { Role } from '../../generated/prisma';
import { getMyProfileController } from '../controllers/user1.controller';

const router = Router();

router.get(
    '/profile', 
    authenticate, 
    getMyProfileController
);

router.post(
    '/add-points', 
    authenticate, 
    authorize(Role.organizer),
    addPoints
);

export default router;