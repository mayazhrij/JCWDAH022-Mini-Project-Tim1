import { Request, Response } from 'express';
// Sesuaikan path import berdasarkan lokasi file Anda
import { AuthRequest } from '../types/auth'; 
import { EventCreationBody } from '../types/event'; // Import interface baru
import { PrismaClient } from '../../generated/prisma';
import { PromotionCreationBody } from '../types/event';


const prisma = new PrismaClient();

export const createEvent = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    // --- TITIK 1: Data Mentah yang Dibaca Express ---
    console.log("DEBUG 1 - RAW BODY:", req.body);
    // ---

    const organizerId = req.user!.userId; 
    const data: EventCreationBody = req.body; 

    // --- TITIK 2: Nilai Variabel Kritis Sebelum Validasi ---
    console.log("DEBUG 2 - DATA NAME:", data.name);
    console.log("DEBUG 3 - TICKET TYPE ARRAY STATUS:", Array.isArray(data.ticketTypes), data.ticketTypes?.length); 
    // ---

    // Baris yang memicu 400 Bad Request:
    if (!data.name || !data.ticketTypes || data.ticketTypes.length === 0) {
        return res.status(400).json({ message: "Nama event dan minimal satu jenis tiket wajib diisi." });
    }

    // 2. Hitung Total Kuota
    // Ini akan menjadi nilai availableSeats di tabel Event
    const totalQuota = data.ticketTypes.reduce((sum, ticket) => sum + ticket.quota, 0);

    try {
        // --- PRISMA TRANSACTION: Atomic Operation ---
        await prisma.$transaction(async (tx) => {
            
            // 3. Buat Event Utama
            const newEvent = await tx.event.create({
                data: {
                    organizerId: organizerId,
                    name: data.name,
                    description: data.description,
                    category: data.category,
                    location: data.location,
                    // Pastikan string tanggal diubah menjadi Date object
                    startDate: new Date(data.startDate), 
                    endDate: new Date(data.endDate), 
                    // priceIdr diisi dari harga tiket termurah/0 (Opsional)
                    priceIdr: data.ticketTypes.sort((a,b) => a.ticketPrice - b.ticketPrice)[0].ticketPrice || 0,
                    availableSeats: totalQuota, // Kuota total
                }
            });

            // 4. Siapkan Data untuk Ticket Types
            const ticketData = data.ticketTypes.map(ticket => ({
                eventId: newEvent.id,
                ticketName: ticket.ticketName,
                ticketPrice: ticket.ticketPrice, 
                quota: ticket.quota,
            }));

            // 5. Buat Semua Jenis Tiket
            await tx.ticketType.createMany({
                data: ticketData,
            });

            return newEvent;

        }); // END TRANSACTION

        return res.status(201).json({ 
            message: "Event berhasil dibuat dan jenis tiket telah dicatat.", 
        });

    } catch (error) {
        console.error("Error creating event:", error);
        return res.status(500).json({ 
            message: "Gagal membuat event. Terjadi kesalahan server." 
        });
    }
};

// controllers/event.controller.ts (Fungsi getEventListPublic)

export const getEventListPublic = async (req: Request, res: Response): Promise<Response | void> => {
    // Ambil query params untuk search (q) dan filter (category, location)
    const { q, category, location } = req.query; 

    try {
        const now = new Date();
        const whereClause: any = {
            // Logika default: Hanya tampilkan event yang belum selesai
            endDate: {
                gt: now // Hanya event yang end_date-nya lebih besar dari hari ini
            }
        };


        // 1. Logika Search Bar (q)
        if (q && typeof q === 'string') {
            const searchTerms = { contains: q, mode: 'insensitive' as const };
            
            // Terapkan OR logic untuk mencari di Name ATAU Description
            whereClause.OR = [
                { name: searchTerms },
                { description: searchTerms },
            ];
        }

        // 2. Logika Filter (Hanya jika parameter ada)
        if (category && typeof category === 'string') {
            whereClause.category = category;
        }
        if (location && typeof location === 'string') {
            whereClause.location = location;
        }

        // 3. Query Event dari Database
        const events = await prisma.event.findMany({
            where: whereClause,
            // Include detail tiket termurah (agar frontend tahu harga minimum)
            include: {
                ticketTypes: {
                    orderBy: { ticketPrice: 'asc' },
                    take: 1, 
                    select: { ticketPrice: true }
                },
                promotions: {
                    where: {
                        startDate: { lte: now }, // Sudah mulai
                        endDate: { gte: now },   // Belum berakhir
                    },
                    select: { title: true }, // Ambil hanya judulnya
                }
            },
            orderBy: {
                startDate: 'asc', // Event yang akan datang lebih dulu
            }
        });

        return res.status(200).json({ 
            message: "Daftar event berhasil diambil.", 
            data: events 
        });

    } catch (error) {
        console.error("Error fetching event list:", error);
        return res.status(500).json({ 
            message: "Gagal mengambil daftar event." 
        });
    }
};

export const getEventDetailPublic = async (req: Request, res: Response): Promise<Response | void> => {
    // 1. Ambil ID dari URL parameter
    const eventId = req.params.id; 

    try {
        // 2. Query Event BESERTA semua detail TicketTypes
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                // Relasi lainnya...
                
                // --- PERBAIKAN KRITIS: Tambahkan OrderBy di TicketTypes ---
                ticketTypes: {
                    orderBy: {
                        ticketPrice: 'asc', // Urutkan berdasarkan harga termurah (ascending)
                    },
                },
            }
        });

        if (!event) {
            // Jika ID tidak ditemukan di DB, respons yang benar adalah 404
            return res.status(404).json({ message: "Detail event tidak ditemukan." });
        }

        return res.status(200).json({ data: event });

    } catch (error) {
        console.error("Error fetching event detail:", error);
        return res.status(500).json({ message: "Gagal mengambil detail event." });
    }
};

interface UpdateEventBody {
    name?: string;
    description?: string;
    // ... fields event lainnya
    newTicketTypes?: Array<{ 
        ticketName: string; 
        ticketPrice: number; 
        quota: number; 
    }>;
}

/**
 * @route PUT /events/:id
 * @desc Organizer mengupdate event dan menambahkan jenis tiket baru.
 * @access Private/Organizer
 */
export const updateEvent = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const eventId = req.params.id;
    const organizerId = req.user!.userId;
    const { name, description, newTicketTypes } = req.body as UpdateEventBody; 

    try {
        // 1. Verifikasi Kepemilikan Event
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
            select: { organizerId: true }
        });
        if (!existingEvent || existingEvent.organizerId !== organizerId) {
            return res.status(403).json({ message: "Akses ditolak." });
        }

        await prisma.$transaction(async (tx) => {
            let seatsChange = 0;
            
            // 2. Logic Tambah Tiket Baru 
            if (newTicketTypes && newTicketTypes.length > 0) {
                const ticketsToCreate = newTicketTypes.map(ticket => {
                    seatsChange += Number(ticket.quota);
                    return {
                        eventId: eventId,
                        ticketName: ticket.ticketName,
                        ticketPrice: Number(ticket.ticketPrice),
                        quota: Number(ticket.quota),
                        availableSeats: Number(ticket.quota)
                    };
                });
                
                await tx.ticketType.createMany({ data: ticketsToCreate });

                // 3. Update Kuota Total Event
                 await tx.event.update({
                    where: { id: eventId },
                    data: { availableSeats: { increment: seatsChange } }
                });
            }

            // 4. Update Detail Event (Name, Description, dll.)
            if (name || description) {
                await tx.event.update({
                     where: { id: eventId },
                     data: {
                         name: name,
                         description: description,
                         // ... field update lainnya
                     }
                });
            }

            return res.status(200).json({ message: "Event berhasil diperbarui dan tiket promosi ditambahkan." });
        });
    } catch (error) {
        console.error("Error updating event:", error);
        return res.status(500).json({ message: "Gagal memperbarui event." });
    }
};

/**
 * @route POST /promotions
 * @desc Organizer membuat record promosi waktu murni (TANPA VOUCHER CODE/NILAI DISKON).
 * @access Private/Organizer
 */
export const createPromotion = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const organizerId = req.user!.userId; 
    const data = req.body; // Gunakan data mentah karena interface sudah kita hapus field yang bermasalah
    
    // Validasi Dasar (Hanya cek eventId, title, dan tanggal)
    if (!data.eventId || !data.title || !data.startDate || !data.endDate) {
        return res.status(400).json({ message: "Event ID, judul, dan tanggal wajib diisi." });
    }
    
    try {
        // 1. Verifikasi Kepemilikan Event
        const event = await prisma.event.findUnique({
            where: { id: data.eventId },
            select: { organizerId: true }
        });

        if (!event || event.organizerId !== organizerId) {
            return res.status(403).json({ message: "Akses terlarang. Anda bukan pemilik event ini." });
        }

        // 2. Buat Record Promosi (Tanpa field code, value, dan type)
        const newPromotion = await prisma.promotion.create({
            data: {
                eventId: data.eventId,
                title: data.title,
                description: data.description,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                // Field diskon tidak ada, jadi tidak perlu diisi
            }
        });

        return res.status(201).json({ 
            message: "Promosi waktu berhasil dicatat. Diskon harus diatur pada Jenis Tiket.", 
            promotion: newPromotion
        });

    } catch (error) {
        // ... (Error handling)
        return res.status(500).json({ message: "Gagal membuat promosi waktu." });
    }
};

// controllers/promotion.controller.ts (Tambahan)

/**
 * @route GET /promotions/active
 * @desc Mengambil semua promosi yang sedang berlaku saat ini.
 * @access Public
 */
export const getActivePromotions = async (req: Request, res: Response): Promise<Response | void> => {
    const now = new Date();
    try {
        const activePromos = await prisma.promotion.findMany({
            where: {
                startDate: { lte: now }, // Mulai sebelum atau pada hari ini
                endDate: { gte: now },   // Berakhir setelah atau pada hari ini
            },
            // Sertakan detail event agar frontend bisa menautkan
            include: { event: { select: { id: true, name: true } } } 
        });

        return res.status(200).json({ data: activePromos });

    } catch (error) {
        return res.status(500).json({ message: "Gagal mengambil daftar promosi aktif." });
    }
};

export const getOrganizerEvents = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const organizerId = req.user!.userId;

    try {
        const events = await prisma.event.findMany({
            where: { organizerId: organizerId },
            include: {
                ticketTypes: {
                    select: { id: true, ticketName: true }
                },
                promotions: true 
            },
            orderBy: { startDate: 'asc' }
        });

        return res.status(200).json({ data: events });

    } catch (error) {
        console.error("Error fetching organizer events:", error);
        return res.status(500).json({ message: "Gagal memuat daftar event Anda." });
    }
};

/**
 * @route GET /tickets/:id
 * @desc Mengambil detail tiket spesifik dan event terkait untuk halaman checkout.
 * @access Private/Authenticated
 */
export const getTicketDetailController = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const ticketTypeId = req.params.id; 

    try {
        // 1. Cari Tiket Target untuk mendapatkan Event ID
        const targetTicket = await prisma.ticketType.findUnique({
            where: { id: ticketTypeId },
            select: { eventId: true }
        });

        if (!targetTicket) {
            return res.status(404).json({ message: "Tiket tidak ditemukan." });
        }
        
        const eventId = targetTicket.eventId;

        // 2. Ambil SEMUA Detail Event dan Semua Jenis Tiket
        const eventDetail = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                ticketTypes: true, // WAJIB: Ambil semua jenis tiket (quota, price, etc.)
                organizer: { select: { name: true } },
                // ... include relasi lain yang dibutuhkan checkout (misal: lokasi, deskripsi)
            }
        });
        
        if (!eventDetail) {
            return res.status(404).json({ message: "Event terkait tiket ini tidak ditemukan." });
        }
        
        // Response Sukses: Kembalikan Event Detail (yang mencakup semua tiket)
        // Kita mengembalikan eventDetail secara langsung untuk digunakan frontend
        return res.status(200).json({ data: eventDetail });

    } catch (error) {
        console.error("Error fetching ticket detail:", error);
        return res.status(500).json({ message: "Gagal memuat detail tiket." });
    }
};