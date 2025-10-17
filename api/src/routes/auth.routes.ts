// routes/auth.routes.ts
import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth1.controller';
import { authenticate, authorize } from '../middlewares/auth1.middleware';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser); 
router.get('/organizer/dashboard', authenticate , authorize('organizer') , (req , res) => {
    res.json({ message: 'Welcome to the Organizer Dashboard' });
});

export default router;
