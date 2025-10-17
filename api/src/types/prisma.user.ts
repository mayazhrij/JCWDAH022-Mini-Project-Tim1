import { Request } from "express";

export interface PrismaUserRequest extends Request {
    user?: {
        userId: string;  // Tambah userId
        role: string;    // Tambah role jika perlu
    };
}