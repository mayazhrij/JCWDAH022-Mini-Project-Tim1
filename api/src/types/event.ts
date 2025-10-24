interface TicketTypeInput {
    ticketName: string;
    ticketPrice: number;
    quota: number;
}

export interface EventCreationBody {
    name: string;
    description?: string;
    category: string;
    location: string;
    startDate: string;
    endDate: string;
    ticketTypes: TicketTypeInput[]; 
}

export interface PromotionCreationBody {
    eventId: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
}