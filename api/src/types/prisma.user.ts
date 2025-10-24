import { Request } from "express";

export interface PrismaUserRequest extends Request {
    user?: {
        userId: string;
        role: string;    
    };
}