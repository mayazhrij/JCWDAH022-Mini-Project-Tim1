import { Request, Response } from 'express';
import prismaClient from '../libs/prisma';
import bcrypt from 'bcryptjs';
import jwt, { sign } from 'jsonwebtoken';
import { RegisterBodyWithRole, LoginBody, TokenPayload } from '../types/auth'; 
import { generateReferralCode } from '../utils/helpers';
import { generateCouponCode } from '../utils/referral.utils';
import { date } from 'yup';

enum Role {
  customer = 'customer',
  organizer = 'organizer'
}

const prisma = prismaClient;
const AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET || 'ganti_di_env_yang_aman'; 

export const registerUser = async (req: Request<{}, {}, RegisterBodyWithRole>, res: Response): Promise<Response | void> => {
    const { name, email, password, role , referralCode } = req.body;


    if (!email || !password) {
        return res.status(400).json({ message: "Email dan password wajib diisi." });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: "Password minimal 8 karakter." });
    }

    let referrerUser = null;
    if (referralCode) {
      console.log(`Mencari referrer dengan kode: ${referralCode}`);
      referrerUser = await prisma.user.findUnique({
        where: { referralCode }
      });
      if (!referrerUser) {
        return res.status(400).json({ message: "Kode referral tidak valid." });
      }
      console.log(`Referrer ditemukan: ${referrerUser.name} (${referrerUser.id})`);
    }

    
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        return res.status(409).json({ message: "Email sudah terdaftar." }); 
      }

        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt);
        const finalRole = (role === 'organizer') ? Role.organizer : Role.customer;
        
        const newReferralCode = generateReferralCode(); 
        
        const newUser = await prisma.user.create({
          data: {
            email,
            name: name ? name : null,
            passwordHash: hashedPassword, 
            role: finalRole,             
            referralCode: newReferralCode,
            referredById: referrerUser ? referrerUser.id : null      
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            referralCode: true,
            points: true,
            createdAt: true,
          }
        });
        
        if (referrerUser) {
          console.log("Memproses rewards referral...");
          try {
            const couponCode = generateCouponCode();
            const expiryDate = new Date(Date.now() + 90*24*60*60*1000); // 3 bulan
            
            await prisma.$transaction([
              prisma.user.update({
                where: { id: referrerUser.id },
                data: { points: { increment: 10000 } }
              }),

              prisma.point.create({
                data: {
                  userId: referrerUser.id,
                  amount: 10000,
                  reason: `Points dari referral ${newUser.email}`,
                  expiresAt: expiryDate,
                  isActive: true
                }
              }),

              prisma.coupon.create({
                data: {
                  userId: newUser.id,
                  code: couponCode,
                  discount: 10000,
                  isUsed: false,
                  expiresAt: expiryDate
                }
              })
            ]);
            
            console.log(`Reward berhasil: +10000 poin untuk ${referrerUser.email}, kupon ${couponCode} untuk ${newUser.email}`);
          } catch (rewardError) {
            console.error("Error saat memproses reward referral:", rewardError);
            // Tetap lanjutkan karena user sudah terbuat
          }
        }

        res.status(201).json({ 
            message: `Pendaftaran berhasil! Akun ${finalRole.toUpperCase()} telah dibuat.`, 
            user: newUser
        });

    } catch (error) {
        console.error("Error saat pendaftaran:", error);
        
        if (error instanceof Error && 'code' in error && error.code === 'P2002') {
            return res.status(500).json({ message: "Gagal membuat kode referral unik atau konflik DB." });
        }
        return res.status(500).json({ message: "Terjadi kesalahan server saat mendaftar." });
    }
};

export const loginUser = async (req: Request<{}, {}, LoginBody>, res: Response): Promise<Response | void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Kredensial tidak valid. Silakan periksa email atau password Anda." }); 
    }

    // 3. Verifikasi Password dengan Bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Kredensial tidak valid. Silakan periksa email atau password Anda." });
    }

    const payload: TokenPayload = {
      userId: user.id,
      role: user.role as 'customer' | 'organizer', 
    };

    const token = sign(
      payload,
      AUTH_JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.status(200).json({ 
      message: "Login berhasil!", 
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
      }
    });

  } catch (error) {
    console.error("Error saat login:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server saat proses login." });
  }
};