// src/routes/user.routes.ts

import { Router } from 'express';
// Import middleware yang sudah kita buat
import { authenticate, authorize } from '../middlewares/auth1.middleware';
import { addPoints } from '../controllers/user1.controller';
import { Role } from '../../generated/prisma'; // Import Role

const router = Router();

// Route untuk memberikan poin (Hanya Organizer yang berhak)
// POST /users/add-points
router.post(
    '/add-points', 
    authenticate, 
    authorize(Role.organizer), // WAJIB Otorisasi Organizer
    addPoints
);

// TODO: Tambahkan route untuk user profile lainnya di sini

export default router;