import prisma from "../libs/prisma";
import { PrismaUserRequest } from "../types/prisma.user";
import { Response } from "express";
import { Request } from "express";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; 
import { sendResetPasswordEmail } from "../utils/email"; 

type UserProfilePicture = { profilePicture: string | null };

export const updateProfilePicture = async (req: PrismaUserRequest, res: Response) => {
    try {
        console.log("User ID di controller:", req.user?.userId);
        if (!req.user?.userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filePath = `/uploads/profile-pictures/${req.file.filename}`;
        const user: UserProfilePicture | null = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { profilePicture: true }
        });

        await prisma.user.update({
            where: { id: req.user.userId },
            data: { profilePicture: filePath }
        });
        res.json({ message: "profile picture updated", filePath });

    } catch (error) {
        console.error("Error in updateProfilePicture:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const changePassword = async (req: PrismaUserRequest, res: Response) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!req.user?.userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { passwordHash: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isOldPasswordValid) {
            return res.status(400).json({ message: "Old password is incorrect" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.user.userId },
            data: { passwordHash: hashedNewPassword }
        });

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const resetToken = jwt.sign({ userId: user.id }, process.env.AUTH_JWT_SECRET!, { expiresIn: '1h' });

        await prisma.passwordResetToken.create({
            data: {
                token: resetToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 3600000)
            }
        });

        await sendResetPasswordEmail(email, resetToken);

        res.json({ message: "Reset password email sent" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const confirmResetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        const decoded = jwt.verify(token, process.env.AUTH_JWT_SECRET!) as { userId: string };
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash: hashedPassword }
        });
        await prisma.passwordResetToken.delete({ where: { token } });

        res.json({ message: "Password reset successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};