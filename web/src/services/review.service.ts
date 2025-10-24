import { api } from './api';
import { isAxiosError } from 'axios';

interface Review {
    id: string;
    userId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
}

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

interface ReviewStatus {
    status: 'DONE' | 'PENDING' | 'EXPIRED' | 'NOT_FOUND'; 
    hasReviewed: boolean;
}

interface ReviewPayload {
    eventId: string;
    rating: number;
    comment?: string;
}

export const checkUserAttendanceAndReviewStatus = async (eventId: string): Promise<ReviewStatus> => {
    try {
        const response = await api.get('/reviews/status', {
             params: { eventId: eventId }
        });
        return response.data as ReviewStatus;

    } catch (error) {
        if (isAxiosError(error) && error.response) {
             if (error.response.status === 404) {
                 return { status: 'NOT_FOUND', hasReviewed: false };
             }
            throw new Error(error.response?.data?.message || 'Gagal memeriksa status ulasan.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};

export const submitReview = async (data: ReviewPayload) => {
    try {
        const response = await api.post('/reviews', data);
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            throw new Error(error.response?.data?.message || 'Gagal mengirim ulasan.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};