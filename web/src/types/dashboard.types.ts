export interface DashboardStats {
  totalEvents: number;
  totalTransactions: number;
  revenueByMonth: { month: string; revenue: number }[];
  eventsByDay: { day: string; count: number }[];
}

export interface Transaction {
  id: string;
  eventId: string;
  userId: string;
  user?: { name: string; email: string; id: string };
  event?: { name: string; id: string };
  status: 'waiting_payment' | 'waiting_confirmation' | 'done' | 'rejected' | 'expired' | 'canceled';
  paymentProof: string | null;
  totalPrice: number;
  quantity: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  category: string;
  location: string;
  startDate: string | Date;
  endDate: string | Date;
  priceIdr: number;
  availableSeats: number;
  organizerId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}