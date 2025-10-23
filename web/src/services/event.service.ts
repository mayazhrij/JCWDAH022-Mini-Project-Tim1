// src/services/event.service.ts

import { api } from './api'; 
import { EventResponse } from '@/types/data'; 
import { isAxiosError } from 'axios';
import { EventCreationBody } from '@/types/event';

export const getEvents = async (query?: string): Promise<EventResponse[]> => {
    try {
        const response = await api.get('/events', {
            params: { q: query },
        });
        
        // Asumsi backend mengembalikan { data: [event1, event2] }
        return response.data.data as EventResponse[]; 

    } catch (error) {
        // --- PERBAIKAN: Tangkap error di sini ---
        if (isAxiosError(error)) {
            // Log error spesifik dari backend (misalnya status 500)
            console.error(`[API Error /events]: Status ${error.response?.status} -`, error.response?.data);
        } else {
            console.error("[Network Error /events]:", error);
        }
        
        // Mengembalikan array kosong agar Server Component tidak crash
        return []; 
    }
};

export const createEventApi = async (data: EventCreationBody) => {
    const response = await api.post('/events', data);
    return response.data;
};

// Asumsi EventDetailResponse interface ada di types/data.ts
export interface EventDetailResponse {
    id: string;
    name: string;
    description: string;
    startDate: string;
    location: string;
    priceIdr: number;
    availableSeats: number;
    
    // Relasi
    organizer: { id: string, name: string };
    ticketTypes: Array<{ 
        id: string, 
        ticketName: string, 
        ticketPrice: number, 
        quota: number, // <--- FIELD YANG HILANG DITAMBAHKAN DI SINI
    }>;
    
    // Rating (diambil dari endpoint lain atau dari include)
    ratings: {
        average: string;
        totalReviews: number;
    }
    reviews: Array<{ id: string, rating: number, comment: string }>;
}

export const getEventDetail = async (eventId: string): Promise<EventDetailResponse> => {
    try {
        const response = await api.get(`/events/${eventId}`);
        return response.data.data as EventDetailResponse;
    } catch (error) {
        // --- PERBAIKAN KRITIS UNTUK ERROR HANDLING ---
        if (isAxiosError(error) && error.response) {
            // Jika error dari backend, lempar pesan spesifik
            const errorMessage = error.response.data?.message;
            // Melempar Error baru dengan pesan yang spesifik atau error standar
            throw new Error(errorMessage || `Gagal mengambil detail event (Status: ${error.response.status}).`);
        }
        // Jika bukan error Axios (misalnya error jaringan atau error tak terduga)
        throw new Error('Terjadi kesalahan jaringan atau kesalahan tak terduga.');
    }
};

// --- SERVICE BARU: MENGAMBIL EVENT MILIK ORGANIZER ---
export const getOrganizerEvents = async () => {
    try {
        // Panggil endpoint backend yang baru dibuat
        const response = await api.get('/events/organizer/events');
        return response.data.data; 
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response?.data?.message || 'Gagal memuat event organizer.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};