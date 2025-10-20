// src/app/page.tsx

import axios from 'axios';
// Import getEvents dari service/event.service.ts
import { getEvents } from '@/services/event.service'; 
import EventListClient from '@/components/EventListCLient'; 
import { EventResponse } from '@/types/data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default async function Home() {
    let initialEvents: EventResponse[] = [];
    let fetchError = null;

    try {
        // 1. PANGGIL API di Server
        initialEvents = await getEvents(); 
    } catch (error) {
        // 2. Tangkap error API/jaringan dan catat
        console.error("Failed to fetch events for Homepage:", error);
        fetchError = "Gagal memuat event dari server. Mohon coba lagi nanti."; 
    }

    return (
        <main className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-center">List of Upcoming Events</h1>
            
            {/* Tampilkan pesan error jika fetch gagal */}
            {fetchError ? (
                <div className="text-red-600 text-center p-4 border border-red-300 rounded-lg">
                    {fetchError}
                </div>
            ) : (
                // Lanjutkan rendering jika tidak ada error
                <EventListClient initialEvents={initialEvents} />
            )}
        </main>
    );
}

