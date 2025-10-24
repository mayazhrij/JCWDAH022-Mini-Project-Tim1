import { Router } from 'express';
import { authenticate } from '../middlewares/auth1.middleware';
import { getDashboardStats, getEvents, updateEvent, getTransactions, acceptTransaction, rejectTransaction } from '../controllers/dashboard.controller';

const router = Router();
router.use(authenticate);
router.get('/stats', getDashboardStats);
router.get('/events', getEvents);
router.put('/events/:id', updateEvent);
router.get('/transactions', getTransactions);
router.post('/transactions/accept', acceptTransaction);
router.post('/transactions/reject', rejectTransaction);

export default router;