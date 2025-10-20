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