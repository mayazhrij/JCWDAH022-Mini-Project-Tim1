import { api } from './api'; 
import { isAxiosError } from 'axios';
import { PromotionCreationBody } from '@/types/event'; 

export const createPromotionApi = async (data: PromotionCreationBody) => {
    try {
        const response = await api.post('/events/promotions', data); 
        return response.data;
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response?.data?.message || 'Gagal membuat promosi. Cek data yang dikirim.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};