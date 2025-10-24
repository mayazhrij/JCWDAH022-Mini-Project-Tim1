export interface EventResponse {
    id: string;
    name: string;
    location: string;
    startDate: string;
    endDate: string;
    promotions: Array<{ title: string }>; 
    ticketTypes: Array<{ ticketPrice: number }>; 
    description: string;
    category: string;
    };
