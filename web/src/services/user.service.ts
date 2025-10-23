import { api } from './api'; 
import { isAxiosError } from 'axios';

// --- INTERFACE DATA YANG DIBUTUHKAN CHECKOUT PAGE ---

// Asumsi struktur data profil yang dikembalikan backend
interface UserProfileResponse {
    id: string;
    name: string;
    email: string;
    points: number; // KRITIS: Saldo poin
    role: string;
}

// Interface untuk data detail tiket yang dibutuhkan Checkout Page
interface TicketDetailResponse {
    ticketName: string;
    ticketPrice: number; // Harga satuan tiket
    quota: number;       // Kuota tersedia
    // Detail event yang terhubung
    event: {
        id: string;
        name: string;
        organizerId: string;
        startDate: string;
    };
}
// -----------------------------------------------------


/**
 * @desc Mengambil saldo poin dan detail profile user yang sedang login.
 * @returns Promise<UserProfileResponse>
 */
export const getMyProfile = async (): Promise<UserProfileResponse> => {
    try {
        // Asumsi: Anda memiliki endpoint di backend untuk mengambil detail user
        const response = await api.get('/users/profile'); 
        // Asumsi backend merespons { data: { id, points, name, ... } }
        return response.data.data as UserProfileResponse;
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            // Jika token kadaluarsa, akan ditangkap oleh useAuthStatus
            throw new Error(error.response.data?.message || 'Gagal memuat profil dan poin.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};

/**
 * @desc Mengambil detail tiket spesifik dan event yang terhubung untuk halaman checkout.
 * @param ticketTypeId ID tiket yang akan dibeli (didapat dari URL)
 * @returns Promise<TicketDetailResponse>
 */
export const getTicketDetail = async (ticketTypeId: string): Promise<TicketDetailResponse> => {
    try {
        // Asumsi: Anda memiliki endpoint di backend untuk mengambil detail tiket
        // Endpoint ini harus melakukan include relasi Event (name, startDate, dll.)
        const response = await api.get(`events/tickets/${ticketTypeId}`); 
        return response.data.data as TicketDetailResponse;
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response?.data?.message || 'Tiket tidak ditemukan atau error server.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};
