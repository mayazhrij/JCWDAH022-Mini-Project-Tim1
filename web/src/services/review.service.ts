import { api } from './api';
import { isAxiosError } from 'axios';

interface Review {
    id: string;
    userId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
}

// Interface untuk data yang dikembalikan backend oleh GET /events/:id
interface EventDetailResponse {
    id: string;
    name: string;
    description: string;
    startDate: string;
    location: string;
    priceIdr: number;
    availableSeats: number;
    
    // Relasi
    organizer: { id: string, name: string };
    ticketTypes: Array<{ id: string, ticketName: string, ticketPrice: number, quota: number }>;
    
    ratings: {
        average: string;
        totalReviews: number;
    }
    reviews: Review[];
}

// --- Interface Data (Wajib) ---
interface ReviewStatus {
    status: 'DONE' | 'PENDING' | 'EXPIRED' | 'NOT_FOUND'; 
    hasReviewed: boolean;
}

interface ReviewPayload {
    eventId: string;
    rating: number;
    comment?: string;
}
// ------------------------------

/**
 * Mengecek apakah user sudah hadir (status DONE) dan belum pernah me-review.
 * Menggunakan URL Statis dan mengirim eventId via Query Parameter.
 */
export const checkUserAttendanceAndReviewStatus = async (eventId: string): Promise<ReviewStatus> => {
    try {
        // PERBAIKAN: Menggunakan endpoint statis dan mengirim eventId via QUERY
        const response = await api.get('/reviews/status', {
             params: { eventId: eventId }
        });
        
        // Asumsi backend merespons 200 OK dengan { status: 'DONE' }
        return response.data as ReviewStatus;

    } catch (error) {
        if (isAxiosError(error) && error.response) {
            // MOCK: Ganti ini dengan logic yang benar jika ada error
             if (error.response.status === 404) {
                 return { status: 'NOT_FOUND', hasReviewed: false };
             }
            throw new Error(error.response?.data?.message || 'Gagal memeriksa status ulasan.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};

/**
 * Mengirimkan review dan rating ke backend.
 */
export const submitReview = async (data: ReviewPayload) => {
    try {
        // PERBAIKAN: Menggunakan endpoint statis dan mengirim payload di body
        const response = await api.post('/reviews', data);
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            // Error dari backend (misalnya 409 Conflict - Sudah pernah review)
            throw new Error(error.response?.data?.message || 'Gagal mengirim ulasan.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};