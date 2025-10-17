// types/auth.ts

import { Request } from 'express';

// Role opsional di body request
export interface RegisterBodyWithRole {
    name?: string;
    email: string;
    password: string;
    role?: 'customer' | 'organizer'; 
    referralCode?: string; // Tambahan field referrerCode
}

export interface LoginBody {
    email: string;
    password: string;
}

export interface TokenPayload {
    userId: string;
    role: 'customer' | 'organizer';
}

export interface AuthRequest extends Request { 
    user?: TokenPayload; 
}