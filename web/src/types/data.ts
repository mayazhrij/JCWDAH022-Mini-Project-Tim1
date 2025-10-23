// web/src/types/data.ts (Buat file ini)

// Definisikan interface EventResponse di sini
export interface EventResponse {
    id: string;
    name: string;
    location: string;
    startDate: string;
    endDate: string;
    // Ambil array dari ticketTypes yang Anda butuhkan
    promotions: Array<{ title: string }>; 
    ticketTypes: Array<{ ticketPrice: number }>; 
    description: string;
    category: string;
    };
