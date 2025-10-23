import { api } from './api';
import { DashboardStats, Event, Transaction } from '../types/dashboard.types'; // Perbaiki path

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getEvents = async (): Promise<Event[]> => {
  const response = await api.get('/dashboard/events');
  return response.data;
};

export const updateEvent = async (id: string, data: Partial<Event>): Promise<Event> => {
  const response = await api.put(`/dashboard/events/${id}`, data);
  return response.data;
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await api.get('/dashboard/transactions');
  return response.data;
};

export const acceptTransaction = async (id: string): Promise<void> => {
  await api.post('/dashboard/transactions/accept', { id });
};

export const rejectTransaction = async (id: string): Promise<void> => {
  await api.post('/dashboard/transactions/reject', { id });
};
