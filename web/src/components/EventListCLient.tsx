"use client";

import React, { useState, useEffect } from 'react';
import { TextInput, Spinner, Button } from 'flowbite-react';
import { HiSearch, HiTicket } from 'react-icons/hi';
import EventCard from './EventCard'; 
import { getEvents } from '@/services/event.service'; 
import { EventResponse } from '@/types/data'; 
import { useDebounce } from '@/hooks/useDebounce'; 
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Link from 'next/link';

interface EventListProps {
    initialEvents: EventResponse[];
}

const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    window.location.href = '/';
};

const EventListClient: React.FC<EventListProps> = ({ initialEvents }) => {
    const authStatus = useAuthStatus();
    const isAuthenticated = authStatus.isAuthenticated;
    const role = authStatus.role;

    const isInitialLoadComplete = authStatus.isInitialLoadComplete;

    const [events, setEvents] = useState<EventResponse[]>(initialEvents);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 500); 

    useEffect(() => {
        if (debouncedSearchTerm === '' && initialEvents.length > 0) {
            setEvents(initialEvents);
            return;
        }

        const fetchSearchEvents = async () => {
            setIsLoading(true);
            try {
                const fetchedEvents = await getEvents(debouncedSearchTerm);
                setEvents(fetchedEvents);
            } catch (error) {
                console.error("Failed to fetch events during search:", error);
                setEvents([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSearchEvents();
        
    }, [debouncedSearchTerm]);

    return (
        <div className="flex flex-col gap-6">
            
            <div className="text-center p-4 border rounded-lg">
                {!isInitialLoadComplete ? (
                    <div className="flex flex-col items-center">
                        <Spinner size="md" />
                        <p className="text-sm mt-2">Memuat status sesi...</p>
                    </div> ) : (
                isAuthenticated ? (
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-md text-gray-700 font-semibold">
                            Welcome, {role === 'organizer' ? 'Organizer' : 'Customer'}!
                        </p>

                        {role === 'organizer' && (
                            <Link href='/organizer/dashboard' passHref>
                                <Button size="sm" color="blue">
                                    Go to Dashboard
                                </Button>
                            </Link>
                        )}

                        {role === 'customer' && (
                                <Link href="/transactions/my" passHref>
                                    <Button size="sm" color="blue">
                                        <HiTicket className="mr-2 h-5 w-5" /> My Tickets
                                    </Button>
                                </Link> )}

                        <Button size="sm" color="blue" onClick={handleLogout}>
                            Log Out
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <p className="mb-3 text-sm text-gray-700">
                            Please log in to access more features.
                        </p>

                        <div className='flex flex-row items-center gap-3'>
                        <Link href="/login" passHref>
                            <Button size="sm" color="blue">
                                Login / Register
                            </Button>
                        </Link>

                        <Link href="/organizer/dashboard" passHref>
                            <Button size="sm" color="blue">
                                Organizer Dashboard
                            </Button>
                        </Link>
                        </div>
                    </div>
                    )
                )}
            </div>
        
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


