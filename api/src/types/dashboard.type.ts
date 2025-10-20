// api/src/types/dashboard.types.ts
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
  status: 'waiting_payment' | 'accepted' | 'rejected';
  paymentProof: string;
  amount: number;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  date: Date;
  seats: number;
  availableSeats: number;
  organizerId: string;
}