import { api } from './api'; 
import { EventResponse } from '@/types/data'; 
import { isAxiosError } from 'axios';
import { EventCreationBody } from '@/types/event';

export const getEvents = async (query?: string): Promise<EventResponse[]> => {
    try {
        const response = await api.get('/events', {
            params: { q: query },
        });
        return response.data.data as EventResponse[]; 

    } catch (error) {
        if (isAxiosError(error)) {
            console.error(`[API Error /events]: Status ${error.response?.status} -`, error.response?.data);
        } else {
            console.error("[Network Error /events]:", error);
        }
        return []; 
    }
};

export const createEventApi = async (data: EventCreationBody) => {
    const response = await api.post('/events', data);
    return response.data;
};

export interface EventDetailResponse {
    id: string;
    name: string;
    description: string;
    startDate: string;
    location: string;
    priceIdr: number;
    availableSeats: number;
    
    organizer: { id: string, name: string };
    ticketTypes: Array<{ 
        id: string, 
        ticketName: string, 
        ticketPrice: number, 
        quota: number,
    }>;
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
        if (isAxiosError(error) && error.response) {
            const errorMessage = error.response.data?.message;
            throw new Error(errorMessage || `Gagal mengambil detail event (Status: ${error.response.status}).`);
        }
        throw new Error('Terjadi kesalahan jaringan atau kesalahan tak terduga.');
    }
};

export const getOrganizerEvents = async () => {
    try {
        const response = await api.get('/events/organizer/events');
        return response.data.data; 
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response?.data?.message || 'Gagal memuat event organizer.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};

export interface TicketTypeInput {
    ticketName: string;
    ticketPrice: number;
    quota: number;
}


interface UpdateEventPayload {
    name?: string;
    description?: string;
    newTicketTypes?: TicketTypeInput[];
}

export const updateEventApi = async (eventId: string, data: UpdateEventPayload) => {
    try {
        const response = await api.put(`/events/${eventId}`, data); 
        return response.data;
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response?.data?.message || 'Gagal memperbarui event.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};