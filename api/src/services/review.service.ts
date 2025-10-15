// services/review.service.ts

import { PrismaClient } from '../../generated/prisma'; 

const prisma = new PrismaClient();

/**
 * Fungsi untuk menghitung rata-rata rating dari semua event yang diselenggarakan 
 * oleh Organizer tertentu dan mencatat hasilnya di console.
 * * Catatan: Karena model OrganizerProfile tidak ada, kita mengasumsikan 
 * penghitungan ini akan dilakukan saat data dibaca oleh API GET.
 * * @param organizerId ID Organizer yang ratingnya akan dihitung.
 */
export const updateOrganizerRating = async (organizerId: string): Promise<void> => {
    
    try {
        // 1. Hitung agregasi rating
        // Query ini mencari semua review di mana event.organizerId cocok dengan organizerId yang diberikan.
        const results = await prisma.review.aggregate({
            _avg: { rating: true },
            _count: { id: true }, // Hitung total review
            where: { 
                event: { 
                    organizerId: organizerId 
                } 
            }
        });

        // 2. Ambil Hasil
        const averageRating = results._avg.rating || 0;
        const reviewCount = results._count.id;
        
        // 3. (Opsional: Jika Ada Model OrganizerProfile)
        // Jika Anda memiliki model untuk OrganizerProfile, logic update-nya masuk di sini.
        
        /* // Contoh jika model OrganizerProfile ada dan ditautkan ke User.
        await prisma.organizerProfile.update({
            where: { userId: organizerId }, 
            data: { 
                averageRating: averageRating, 
                reviewCount: reviewCount 
            }
        });
        */

        // 4. Console Log (Untuk verifikasi backend)
        console.log('--------------------------------------------------');
        console.log(`UPDATE RATING ORGANIZER: ${organizerId}`);
        console.log(`Rating Rata-Rata: ${averageRating.toFixed(2)}`);
        console.log(`Total Review: ${reviewCount}`);
        console.log('--------------------------------------------------');

    } catch (error) {
        console.error(`Gagal menghitung rating untuk Organizer ${organizerId}:`, error);
    }
};