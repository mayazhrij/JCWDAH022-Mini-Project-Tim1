"use client";
import { useEffect, useState } from 'react';
import OrganizerNavbar from "@/components/dashboard/OrganizerNavbar";
import { getDashboardStats, getEvents, getTransactions } from '@/services/dashboard.service';
import StatsChart from '@/components/dashboard/StatsChart';
import EventList from '@/components/dashboard/EventList';
import TransactionList from '@/components/dashboard/TransactionList';
import { DashboardStats, Event, Transaction } from '@/types/dashboard.types';
import { HiArrowLeft } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [s, ev, tx] = await Promise.all([getDashboardStats(), getEvents(), getTransactions()]);
        setStats(s ?? null);
        setEvents(ev ?? []);
        setTransactions(tx ?? []);
      } catch (err: any) {
        console.error('Dashboard load error:', err);
        setError(err?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <>
      <OrganizerNavbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              <HiArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          </div>

          {loading && <div className="text-center text-gray-600 py-8">Loading dashboard...</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

          {!loading && !error && (
            <>
              {/* Statistics Section */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Statistics</h2>
                {stats ? <StatsChart stats={stats} /> : <div className="text-gray-500">No statistics available</div>}
              </div>

              {/* Events Section */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Manage Events ({events.length})</h2>
                {events.length > 0 ? (
                  <EventList events={events} onUpdate={setEvents} />
                ) : (
                  <div className="text-gray-500 text-center py-8">No events found</div>
                )}
              </div>

              {/* Transactions Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Manage Transactions ({transactions.length})</h2>
                {transactions.length > 0 ? (
                  <TransactionList transactions={transactions} onUpdate={setTransactions} />
                ) : (
                  <div className="text-gray-500 text-center py-8">No transactions found</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}