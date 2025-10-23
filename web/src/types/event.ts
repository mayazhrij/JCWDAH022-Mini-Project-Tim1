interface TicketTypeInput {
    ticketName: string;
    ticketPrice: number; // Dalam IDR
    quota: number;       // Jumlah kursi yang tersedia
}

export interface EventCreationBody {
    name: string;
    description?: string;
    category: string;
    location: string;
    startDate: string; // Akan di-parse ke Date
    endDate: string;   // Akan di-parse ke Date
    // Daftar jenis tiket yang wajib diisi
    ticketTypes: TicketTypeInput[]; 
    // Anda bisa tambahkan field Promotion/etc. jika diperlukan
}

// Interface untuk data input saat membuat Promosi Waktu Murni
export interface PromotionCreationBody {
    eventId: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    // Karena solusinya Waktu Murni, field diskon tidak diperlukan di sini.
}