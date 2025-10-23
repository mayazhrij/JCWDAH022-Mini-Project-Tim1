import { api } from './api'; 
import { isAxiosError } from 'axios';
// Asumsi interface sudah ada di types/event.ts
import { PromotionCreationBody } from '@/types/event'; 

/**
 * Mengirim permintaan pembuatan promosi baru ke backend.
 */
export const createPromotionApi = async (data: PromotionCreationBody) => {
    try {
        // Panggil endpoint POST /events/promotions
        const response = await api.post('/events/promotions', data); 
        return response.data;
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response?.data?.message || 'Gagal membuat promosi. Cek data yang dikirim.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};