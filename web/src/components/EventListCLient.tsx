"use client";

import React, { useState, useEffect } from 'react';
import { TextInput, Spinner, Button } from 'flowbite-react'; // Import Button
import { HiSearch } from 'react-icons/hi';
import EventCard from './EventCard'; 
import { getEvents } from '@/services/event.service'; 
import { EventResponse } from '@/types/data'; 
import { useDebounce } from '@/hooks/useDebounce'; 
import { useAuthStatus } from '@/hooks/useAuthStatus'; // Import Hook Status Auth
import Link from 'next/link';

interface EventListProps {
    initialEvents: EventResponse[];
}

const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    window.location.href = '/'; // Redirect ke halaman utama
};

const EventListClient: React.FC<EventListProps> = ({ initialEvents }) => {
    const authStatus = useAuthStatus();
    const isAuthenticated = authStatus.isAuthenticated; // <-- Dapatkan status otentikasi
    const role = authStatus.role;

    const [events, setEvents] = useState<EventResponse[]>(initialEvents);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 500); 

    // --- LOGIC KRITIS: USE EFFECT UNTUK DEBOUNCE SEARCH ---
    useEffect(() => {
        // Abaikan panggilan saat komponen baru dimuat dan debouncedSearchTerm masih kosong
        if (debouncedSearchTerm === '' && initialEvents.length > 0) {
            setEvents(initialEvents); // Tampilkan initial events jika search kosong
            return;
        }

        const fetchSearchEvents = async () => {
            setIsLoading(true);
            try {
                // Panggil service getEvents dengan query parameter 'q'
                const fetchedEvents = await getEvents(debouncedSearchTerm);
                setEvents(fetchedEvents);
            } catch (error) {
                console.error("Failed to fetch events during search:", error);
                setEvents([]);
            } finally {
                setIsLoading(false);
            }
        };

        // Panggil fungsi pencarian hanya jika debouncedSearchTerm berubah
        fetchSearchEvents();
        
    }, [debouncedSearchTerm]);

    return (
        <div className="flex flex-col gap-6">
            
            <div className="text-center p-4 border rounded-lg">
                {isAuthenticated ? (
                    // --- TAMPILAN JIKA SUDAH LOGIN (LOGOUT BUTTON) ---
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-md text-gray-700 font-semibold">
                            Welcome, {role === 'organizer' ? 'Organizer' : 'Customer'}!
                        </p>
                        <Button size="sm" color="blue" onClick={handleLogout}>
                            Log Out
                        </Button>
                    </div>
                ) : (
                    // --- TAMPILAN JIKA BELUM LOGIN (LOGIN/REGISTER BUTTON) ---
                    <div className="flex flex-col items-center">
                        <p className="mb-3 text-sm text-gray-700">
                            Please log in to access more features.
                        </p>
                        <Link href="/login" passHref>
                            <Button size="sm" color="blue">
                                Login / Register
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
            
            {/* 2. Search Bar dengan Debounce */}
            <div className="max-w-xl mx-auto w-full">
                <TextInput
                    id="search"
                    type="text"
                    icon={HiSearch}
                    placeholder="Search for events, locations, or categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            
            {/* 3. Tampilan List Event */}
            {isLoading ? (
                <div className="text-center mt-8">
                    <Spinner size="xl" />
                    <p className="mt-2">Searching for events...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events && events.length > 0 ? (
                        events.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 mt-8">
                            No events found. Please try a different keyword.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventListClient;


