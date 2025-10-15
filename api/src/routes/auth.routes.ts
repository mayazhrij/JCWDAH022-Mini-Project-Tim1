// routes/auth.routes.ts
import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth1.controller';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser); 

export default router;
