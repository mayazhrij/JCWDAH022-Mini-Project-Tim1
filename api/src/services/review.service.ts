import { PrismaClient } from '../../generated/prisma'; 

const prisma = new PrismaClient();

export const updateOrganizerRating = async (organizerId: string): Promise<void> => {
    
    try {
        const results = await prisma.review.aggregate({
            _avg: { rating: true },
            _count: { id: true },
            where: { 
                event: { 
                    organizerId: organizerId 
                } 
            }
        });

        const averageRating = results._avg.rating || 0;
        const reviewCount = results._count.id;

        console.log('--------------------------------------------------');
        console.log(`UPDATE RATING ORGANIZER: ${organizerId}`);
        console.log(`Rating Rata-Rata: ${averageRating.toFixed(2)}`);
        console.log(`Total Review: ${reviewCount}`);
        console.log('--------------------------------------------------');

    } catch (error) {
        console.error(`Gagal menghitung rating untuk Organizer ${organizerId}:`, error);
    }
};