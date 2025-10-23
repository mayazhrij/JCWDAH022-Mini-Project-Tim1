"use client";

import React from 'react';
import { Card, Button, Spinner, Alert } from 'flowbite-react';
import { HiArrowLeft, HiClock, HiInformationCircle } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';

// Import services dan hooks
import { useAuthStatus } from '@/hooks/useAuthStatus'; 
import { getOrganizerEvents } from '@/services/event.service'; // Service baru

export default function PromoteEventSelectorPage() {
    const { isAuthenticated, isInitialLoadComplete, role } = useAuthStatus();
    const router = useRouter();
    
    // Guard: Pastikan hanya Organizer yang bisa mengakses (disederhanakan)
    if (!isAuthenticated || role !== 'organizer') {
         if (isInitialLoadComplete) router.push('/auth/login'); // Redirect ke login jika bukan organizer
         return <div className="text-center p-20 min-h-screen"><Spinner size="xl" /></div>;
    }

    // Fetch daftar event milik organizer
    const { data: events, error, isLoading } = useSWR(
        isAuthenticated ? '/organizer/events' : null, 
        getOrganizerEvents
    );
    
    const eventsList = events || [];  // Asumsi backend mengembalikan { data: [...] }

    // Helper untuk format tanggal
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    if (isLoading) return <div className="text-center p-20"><Spinner size="xl" /><p>Memuat daftar event...</p></div>;
    if (error) return <Alert color="failure" icon={HiInformationCircle} className="max-w-4xl mx-auto mt-10">Gagal memuat event: {error.message}</Alert>;


    return (
        <div className="container mx-auto p-4 md:p-10 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Pilih Event untuk Promosi Waktu</h1>
            <p className="mb-4 text-gray-600">Pilih event di bawah yang ingin Anda tandai sebagai promosi.</p>
            
            <Card className="w-full">
                {eventsList.length === 0 ? (
                    <p className="text-center text-gray-500">Anda belum memiliki event yang bisa dipromosikan.</p>
                ) : (
                    <div className="overflow-x-auto w-full">
                        {/* --- PERBAIKAN: MENGGUNAKAN HTML TABLE MURNI --- */}
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            
                            <thead className="text-xs uppercase text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3 min-w-[250px]">Nama Event</th>
                                    <th scope="col" className="px-6 py-3 min-w-[150px]">Tanggal</th>
                                    <th scope="col" className="px-6 py-3 min-w-[100px]">Aksi</th>
                                </tr>
                            </thead>
                            
                            <tbody>
                                {eventsList.map((eventItem: any) => (
                                    <tr key={eventItem.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap min-w-[250px]">
                                            {eventItem.name}
                                        </td>
                                        <td className="px-6 py-4 min-w-[150px]">
                                            {formatDate(eventItem.startDate)}
                                        </td>
                                        <td className="px-6 py-4 min-w-[100px]">
                                            {/* Link ke halaman form promosi dengan mengirim eventId via query param */}
                                            <Link href={`/organizer/promote/form?eventId=${eventItem.id}`} passHref>
                                                <Button size="sm" color="warning" className="w-full">
                                                    <HiClock className="mr-2 h-4 w-4" /> Buat Promosi
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* ---------------------------------------------------- */}
                    </div>
                )}
            </Card>
        </div>
    );
}