import { Router } from 'express';

// Sesuaikan path ini berdasarkan lokasi file Anda
import { authenticate, authorize } from '../middlewares/auth1.middleware'; 
import { createEvent, getEventListPublic, getEventDetailPublic } from '../controllers/event.controller'; 
import { Role } from '../../generated/prisma'; // Import Enum Role dari Prisma
import { createPromotion } from '../controllers/event.controller';

const router = Router();

// GET /events (Route Statis - Harus di atas route dinamis)
router.get('/', getEventListPublic);

// GET /events/:id (Route Dinamis - Diletakkan SETELAH route statis)
router.get('/:id', getEventDetailPublic);


// -------------------------------------------------------------------------
// 2. ROUTE PROTECTED (Event Creation)
// -------------------------------------------------------------------------

// POST /events (Contoh: http://localhost:3000/events)
// Membutuhkan 2 layer keamanan:
// 1. authenticate: Memastikan user memiliki token yang valid.
// 2. authorize: Memastikan role user adalah 'organizer'.
router.post(
    '/', 
    authenticate,          // Wajib: Cek apakah token ada dan valid
    authorize(Role.organizer), // Wajib: Cek apakah role di token adalah organizer
    createEvent
);

router.post(
    '/promotions', // Path Statis
    authenticate, 
    authorize(Role.organizer), 
    createPromotion
);


// Ekspor router agar dapat digunakan di app.ts
export default router;