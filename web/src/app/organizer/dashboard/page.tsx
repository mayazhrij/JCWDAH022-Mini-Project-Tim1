"use client";

import Header from '@/components/Headers';
import { Card } from 'flowbite-react';
import Link from 'next/link';

export default function OrganizerDashboardPage() {
    return (
        <>
        <Header />
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Organizer Main Dashboard</h1>
            <p className="mb-4">Welcome, Organizer! Please select a task below:</p>

            {/* PERBAIKAN: Gunakan Link sebagai wrapper di sekitar Card */}
            <Link href="/organizer/create" className="block">
                <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <h5 className="text-xl font-bold">Create New Event</h5>
                    <p className="font-normal text-gray-700">Start creating your event and ticket types.</p>
                </Card>
            </Link>
            
            {/* TODO: Tambahkan link ke Transaction Management */}
        </div></>
    );
}