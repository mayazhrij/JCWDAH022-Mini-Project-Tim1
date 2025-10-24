import { api } from './api'; 
import { isAxiosError } from 'axios';

interface UserProfileResponse {
    id: string;
    name: string;
    email: string;
    points: number;
    role: string;
}

interface TicketDetailResponse {
    ticketName: string;
    ticketPrice: number;
    quota: number;       
    event: {
        id: string;
        name: string;
        organizerId: string;
        startDate: string;
    };
}

export const getMyProfile = async (): Promise<UserProfileResponse> => {
    try {
        const response = await api.get('/users/profile'); 
        return response.data.data as UserProfileResponse;
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data?.message || 'Gagal memuat profil dan poin.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};

export const getTicketDetail = async (ticketTypeId: string): Promise<TicketDetailResponse> => {
    try {
        const response = await api.get(`events/tickets/${ticketTypeId}`); 
        return response.data.data as TicketDetailResponse;
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response?.data?.message || 'Tiket tidak ditemukan atau error server.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};
