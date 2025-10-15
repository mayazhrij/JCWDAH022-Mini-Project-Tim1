// src/types/transaction.ts

/**
 * Interface untuk body request POST /transactions (Checkout)
 */
export interface CheckoutBody {
    ticketTypeId: string;
    quantity: number; // Jumlah tiket yang dibeli
    usePoints: boolean; // Apakah customer ingin menggunakan poin
}

/**
 * Interface untuk body request POST /transactions/:id/confirm (Konfirmasi Admin)
 */
export interface ConfirmationBody {
    action: 'accept' | 'reject'; // Aksi yang wajib dipilih organizer
}