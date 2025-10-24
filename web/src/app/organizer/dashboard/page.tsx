"use client";

import { useEffect, useState } from 'react';
import OrganizerNavbar from "@/components/dashboard/OrganizerNavbar";
import { getDashboardStats, getEvents, getTransactions } from '@/services/dashboard.service';
import StatsChart from '@/components/dashboard/StatsChart';
import EventList from '@/components/dashboard/EventList';
import TransactionList from '@/components/dashboard/TransactionList';
import { DashboardStats, Event, Transaction } from '@/types/dashboard.types';
import { HiArrowLeft, HiPlus } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import Link from 'next/dist/client/link';
import { Button } from 'node_modules/flowbite-react/dist/components/Button/Button';

import { useAuthStatus } from '@/hooks/useAuthStatus';

export default function DashboardPage() {
  const router = useRouter();
  
  const { isAuthenticated, role, isInitialLoadComplete } = useAuthStatus();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // START REFACTOR: TAMBAH STATE UNTUK ERROR MESSAGE
  const [accessError, setAccessError] = useState<string | null>(null);
  // END REFACTOR
  
  useEffect(() => {
    if (!isInitialLoadComplete) return;

    if (!isAuthenticated || role !== 'organizer') {
      // START REFACTOR: UBAH REDIRECT KE LOGIN PAGE
      setAccessError('Please login only allowed access for Organizer role');
      return;
      // END REFACTOR
    }

    setIsAuthorized(true);
  }, [isAuthenticated, role, isInitialLoadComplete, router]);

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

  // START REFACTOR: TAMBAH TAMPILAN PESAN ERROR SEBELUM REDIRECT
  if (accessError) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">{accessError}</p>
          
          <button 
            onClick={() => router.push('/login')} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login page Now
          </button>

          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go back to Home page
          </button>


        </div>
      </div>
    );
  }
  // END REFACTOR

  // START REFACTOR: UBAH LOADING SCREEN AGAR TIDAK TAMPIL JIKA ADA ERROR
  if (!isInitialLoadComplete || !isAuthorized) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }
  // END REFACTOR

  return (
    <>
      <OrganizerNavbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <button onClick={() => router.push("/")} className="text-gray-600 hover:text-gray-900">
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

              <div className="bg-gray-200 rounded-lg shadow p-6 mb-8 text-black">    
                <Link href="/organizer/create" passHref>
                    <Button color="success">
                        <HiPlus className="mr-2 h-5 w-5" />
                        Create New Event
                    </Button>
                </Link>
              </div>
              <div className="bg-gray-200 rounded-lg shadow p-6 mb-8 text-black">
              <Link href="/organizer/promote" passHref>
                    <Button color="success">
                        <HiPlus className="mr-2 h-5 w-5" />
                        Add Promotion for Your Event
                    </Button>
                </Link>
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