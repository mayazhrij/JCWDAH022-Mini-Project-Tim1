import { Router } from 'express';

// Sesuaikan path ini berdasarkan lokasi file Anda
import { authenticate, authorize } from '../middlewares/auth1.middleware'; 
import { createEvent, getEventListPublic, getEventDetailPublic } from '../controllers/event.controller'; 
import { Role } from '../../generated/prisma'; // Import Enum Role dari Prisma

const router = Router();

// -------------------------------------------------------------------------
// 1. ROUTE PUBLIC (Event Discovery)
// -------------------------------------------------------------------------

// GET /events/:id (Route ini harus ada untuk menangkap ID)
router.get('/:id', getEventDetailPublic);
router.get('/', getEventListPublic);


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


// Ekspor router agar dapat digunakan di app.ts
export default router;