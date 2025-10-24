export interface CheckoutBody {
    ticketTypeId: string;
    quantity: number;
    usePoints: boolean;
}

export interface ConfirmationBody {
    action: 'accept' | 'reject';
}