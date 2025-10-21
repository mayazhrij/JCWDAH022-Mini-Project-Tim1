import { api } from './api'; 
import { isAxiosError } from 'axios';
import { CheckoutBody } from '@/types/transaction'; // Import interface

// Asumsi: Backend mengembalikan object { totalPrice, pointsUsed, countdown, ... }
interface TransactionResponse {
    totalPrice: number;
    pointsUsed: number;
    countdown: string;
    message: string;
    // Tambahkan field lain jika backend mengembalikannya, seperti transactionId
}

/**
 * Mengirim permintaan checkout ke backend.
 * @param data Payload checkout (ticketId, quantity, usePoints)
 * @returns Detail respons transaksi.
 */
export const createTransactionApi = async (data: CheckoutBody): Promise<TransactionResponse> => {
    try {
        const response = await api.post('/transactions', data);
        
        // Mengembalikan data transaksi yang dibutuhkan frontend
        return response.data as TransactionResponse;
        
    } catch (error) {
        // --- Error Handling Kritis ---
        if (isAxiosError(error) && error.response) {
            // Error dari backend (400 Bad Request, 404 Kuota Habis, 403 Forbidden)
            const errorMessage = error.response.data?.message;
            
            // Melemparkan pesan error yang spesifik
            throw new Error(errorMessage || `Checkout gagal dengan status: ${error.response.status}`);
        }
        
        // Error jaringan atau tak terduga
        console.error("Network or Unknown Checkout Error:", error);
        throw new Error('Terjadi kesalahan jaringan atau server tidak merespons.');
    }
};

export const getMyTransactions = async () => {
    try {
        const response = await api.get('/transactions/my');
        
        // KRITIS: Pastikan Anda mengembalikan struktur data yang benar dari backend.
        // Jika backend merespons { data: [...] }, pastikan Anda hanya mengembalikan itu.
        
        return response.data; // Mengembalikan objek penuh { data: [...] }
        
    } catch (error) {
        // Jika status error adalah 401/403, ini berarti token invalid
        if (isAxiosError(error) && error.response?.status === 401) {
            // Ini akan memicu logic di useAuthGuard untuk membersihkan token dan redirect
            throw new Error("Sesi kadaluarsa. Silakan login kembali.");
        }
        throw error;
    }
};
// export const uploadPaymentProofApi = async (id, file) => { ... }