import prisma from "../libs/prisma";
import { PrismaUserRequest } from "../types/prisma.user";
import { Response } from "express";
import fs from "fs";
import path from "path";
import { User } from "../../generated/prisma";

type UserProfilePicture = { profilePicture: string | null };

export const updateProfilePicture = async (req: PrismaUserRequest, res: Response) => {
    try {
        console.log("User ID di controller:", req.user?.userId);  // Ubah jadi userId
        if (!req.user?.userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filePath = `/uploads/profile-pictures/${req.file.filename}`;
        const user: UserProfilePicture | null = await prisma.user.findUnique({
            where: { id: req.user.userId },  // Ubah jadi userId
            select: { profilePicture: true }
        });

        if (user?.profilePicture) {
            const oldFilePath = path.join(__dirname, "../../", user.profilePicture);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        await prisma.user.update({
            where: { id: req.user.userId },  // Ubah jadi userId
            data: { profilePicture: filePath }
        });
        res.json({ message: "profile picture updated", filePath });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};