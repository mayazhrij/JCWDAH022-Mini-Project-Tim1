import { api } from './api'; 
import { isAxiosError } from 'axios';
import { CheckoutBody } from '@/types/transaction'; // Import interface

export const getMyTransactions = async () => {
    try {
        const response = await api.get('/transactions/my');
        return response.data.data; 
    } catch (error) {
        // --- PERBAIKAN: Type Narrowing untuk error ---
        if (isAxiosError(error) && error.response) {
            const errorMessage = error.response.data?.message;
            throw errorMessage || `Gagal mengambil data transaksi (Status: ${error.response.status}).`;
        }
        console.error("Kesalahan Jaringan atau Unknown Error:", error);
        throw 'Terjadi kesalahan jaringan atau kesalahan tak terduga.';
    }
};

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

// --- TODO: Tambahkan service lain di file ini ---

// export const getMyTransactions = async () => { ... }
// export const uploadPaymentProofApi = async (id, file) => { ... }