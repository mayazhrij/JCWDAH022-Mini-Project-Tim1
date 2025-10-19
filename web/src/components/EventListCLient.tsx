"use client"; // WAJIB: Directive ini mengizinkan penggunaan Hooks dan localStorage

import React, { useState, useEffect } from 'react';
import { TextInput, Spinner } from 'flowbite-react';
import { HiSearch } from 'react-icons/hi';
import EventCard from './EventCard'; // Komponen kartu event
import { getEvents } from '@/services/event.service'; // Service API
import { EventResponse } from '@/types/data'; // Interface event
import { useDebounce } from '@/hooks/useDebounce'; // Hook Debounce

interface EventListProps {
    initialEvents: EventResponse[];
}

const EventListClient: React.FC<EventListProps> = ({ initialEvents }) => {
    const [events, setEvents] = useState<EventResponse[]>(initialEvents);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Gunakan Debounce Hook yang sudah kita rencanakan
    const debouncedSearchTerm = useDebounce(searchTerm, 500); 

    // --- EFFECT UNTUK SEARCH ---
    useEffect(() => {
        const fetchSearchEvents = async () => {
            if (debouncedSearchTerm === '' && events.length > 0) return; // Jangan fetch jika list sudah ada
            
            setIsLoading(true);
            // Panggil service getEvents dengan query parameter
            const fetchedEvents = await getEvents(debouncedSearchTerm);
            setEvents(fetchedEvents);
            setIsLoading(false);
        };

        // Pastikan initial fetch tidak mengganggu search
        if (debouncedSearchTerm !== '') {
            fetchSearchEvents();
        } else if (initialEvents && events.length === 0) {
            setEvents(initialEvents);
        }
        
    }, [debouncedSearchTerm, initialEvents]); 


    return (
        <div className="flex flex-col gap-6">
            {/* Search Bar dengan Debounce */}
            <div className="max-w-xl mx-auto w-full">
                <TextInput
                    id="search"
                    type="text"
                    icon={HiSearch}
                    placeholder="Cari Event, Lokasi, atau Kategori..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            
            {/* Tampilan List Event */}
            {isLoading ? (
                <div className="text-center mt-8">
                    <Spinner size="xl" />
                    <p className="mt-2">Mencari event...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events && events.length > 0 ? (
                        events.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 mt-8">
                            Tidak ada event yang ditemukan. Coba kata kunci lain.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventListClient;

