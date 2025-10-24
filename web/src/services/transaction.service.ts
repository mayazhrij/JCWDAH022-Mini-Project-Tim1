import { api } from './api'; 
import { isAxiosError } from 'axios';
import { CheckoutBody } from '@/types/transaction';

interface TransactionResponse {
    totalPrice: number;
    pointsUsed: number;
    countdown: string;
    message: string;
}

export const createTransactionApi = async (data: CheckoutBody): Promise<TransactionResponse> => {
    try {
        const response = await api.post('/transactions', data);
        return response.data as TransactionResponse; // Mengembalikan data asli
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data?.message || 'Gagal checkout. Kesalahan server.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};

export const getMyTransactions = async () => {
    try {
        const response = await api.get('/transactions/my');

        
        return response.data;
        
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
            throw new Error("Sesi kadaluarsa. Silakan login kembali.");
        }
        throw error;
    }
};

export const uploadPaymentProofApi = async (transactionId: string | null, file: File) => {
    if (!transactionId) throw new Error("Transaction ID is missing from URL.");

    try {
        const formData = new FormData();
        formData.append('paymentFile', file); 
        formData.append('transactionId', transactionId);

        const response = await api.post(`/transactions/payment-proof`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data', 
            }
        });
        return response.data;
        
    } catch (error) {
        if (isAxiosError(error)) {
            throw new Error(error.response?.data?.message || 'Gagal mengunggah. Kesalahan server.');
        }
        throw new Error('Terjadi kesalahan jaringan.');
    }
};