"use client";

import React from 'react';
import { Card, Button, Spinner, Alert } from 'flowbite-react';
import { HiArrowLeft, HiClock, HiInformationCircle } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';

// Import services dan hooks
import { useAuthStatus } from '@/hooks/useAuthStatus'; 
import { getOrganizerEvents } from '@/services/event.service';

export default function PromoteEventSelectorPage() {
    const { isAuthenticated, isInitialLoadComplete, role } = useAuthStatus();
    const router = useRouter();
    
    if (!isAuthenticated || role !== 'organizer') {
         if (isInitialLoadComplete) router.push('/auth/login');
         return <div className="text-center p-20 min-h-screen"><Spinner size="xl" /></div>;
    }

    const { data: events, error, isLoading } = useSWR(
        isAuthenticated ? '/organizer/events' : null, 
        getOrganizerEvents
    );
    
    const eventsList = events || [];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    if (isLoading) return <div className="text-center p-20"><Spinner size="xl" /><p>Loading event list...</p></div>;
    if (error) return <Alert color="failure" icon={HiInformationCircle} className="max-w-4xl mx-auto mt-10">Failed to load events: {error.message}</Alert>;


    return (
        <div className="container mx-auto p-4 md:p-10 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Select Event for Time Promotion</h1>
            <p className="mb-4 text-gray-600">Select the event below that you want to mark as a promotion.</p>

            <Card className="w-full">
                {eventsList.length === 0 ? (
                    <p className="text-center text-gray-500">You don't have any events available for promotion.</p>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            
                            <thead className="text-xs uppercase text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3 min-w-[250px]">Event Name</th>
                                    <th scope="col" className="px-6 py-3 min-w-[150px]">Date</th>
                                    <th scope="col" className="px-6 py-3 min-w-[100px]">Action</th>
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
                                            <Link href={`/organizer/promote/form?eventId=${eventItem.id}`} passHref>
                                                <Button size="sm" color="warning" className="w-full">
                                                    <HiClock className="mr-2 h-4 w-4" /> Create Promotion
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}