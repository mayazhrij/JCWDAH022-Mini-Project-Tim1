import { Request } from 'express';

export interface RegisterBodyWithRole {
    name?: string;
    email: string;
    password: string;
    role?: 'customer' | 'organizer'; 
    referralCode?: string;
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