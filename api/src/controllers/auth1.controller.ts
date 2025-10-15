import { Request, Response } from 'express';
// Sesuaikan path import berdasarkan lokasi file Anda
import { PrismaClient, Role } from '../../generated/prisma'; 
import bcrypt from 'bcryptjs';
import jwt, { sign } from 'jsonwebtoken'; // Gunakan sign untuk mengatasi error
import { RegisterBodyWithRole, LoginBody, TokenPayload } from '../types/auth'; 
import { generateReferralCode } from '../utils/helpers'; // Fungsi helper

// --- SETUP ---
const prisma = new PrismaClient();
// Ambil JWT Secret dari environment (pastikan .env terload)
const AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET || 'ganti_di_env_yang_aman'; 


// -----------------------------------------------------------------
// 1. ENDPOINT REGISTER USER (dengan role opsional)
// -----------------------------------------------------------------

/**
 * @route POST /auth/register
 * @desc Mendaftarkan user baru (customer default, organizer opsional)
 * @access Public
 */
export const registerUser = async (req: Request<{}, {}, RegisterBodyWithRole>, res: Response): Promise<Response | void> => {
    const { name, email, password, role } = req.body;

    // --- 1. VALIDASI INPUT AWAL ---
    if (!email || !password) {
        return res.status(400).json({ message: "Email dan password wajib diisi." });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: "Password minimal 8 karakter." });
    }

    try {
        // 2. Cek ketersediaan email
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({ message: "Email sudah terdaftar." }); 
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Tentukan Role Akhir (Logic Role Opsional)
        // Jika body.role adalah 'organizer', gunakan Role.organizer, selain itu gunakan Role.customer
        const finalRole = (role === 'organizer') ? Role.organizer : Role.customer;
        
        // 5. Buat kode referral yang unik
        const referralCode = generateReferralCode(); 
        
        // 6. Simpan User Baru ke Database
        const newUser = await prisma.user.create({
            data: {
                email,
                name: name,
                passwordHash: hashedPassword, 
                role: finalRole,             // Role ditentukan di sini
                referralCode: referralCode,      
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

        // 7. Respon Sukses
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


// -----------------------------------------------------------------
// 2. ENDPOINT LOGIN USER
// -----------------------------------------------------------------

/**
 * @route POST /auth/login
 * @desc Proses login user dan menerbitkan JWT
 * @access Public
 */
export const loginUser = async (req: Request<{}, {}, LoginBody>, res: Response): Promise<Response | void> => {
  const { email, password } = req.body;

  // --- 1. VALIDASI AWAL ---
  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi." });
  }

  try {
    // 2. Cari User berdasarkan Email
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

    // 4. Penerbitan JWT (Token Sesi)
    const payload: TokenPayload = {
      userId: user.id,
      // Memastikan role dikonversi ke string yang aman untuk JWT
      role: user.role as 'customer' | 'organizer', 
    };

    const token = sign(
      payload,
      AUTH_JWT_SECRET,
      { expiresIn: '1d' } // Token berlaku selama 1 hari
    );

    // 5. Respon Sukses
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