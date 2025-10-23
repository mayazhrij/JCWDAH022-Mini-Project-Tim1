"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStatus } from '@/hooks/useAuthStatus'; 
import PromotionForm from '@/components/dashboard/PromotionForm';
import { Spinner, Alert, Button } from 'flowbite-react';
import { HiArrowLeft, HiInformationCircle } from 'react-icons/hi';
import React from 'react';


export default function PromotionFormPage() {
    const { isAuthenticated, isInitialLoadComplete, role } = useAuthStatus();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const eventId = searchParams.get('eventId');
    
    // Guard: Pastikan user terautentikasi dan ada eventId
    if (!isInitialLoadComplete || !isAuthenticated || role !== 'organizer') {
         if (isInitialLoadComplete) router.push('/login');
         return <div className="text-center p-20 min-h-screen"><Spinner size="xl" /></div>;
    }

    if (!eventId) {
         return (
            <div className="text-center p-20 min-h-screen max-w-4xl mx-auto">
                <Alert color="failure" icon={HiInformationCircle}>
                    ID Event tidak ditemukan di URL. Silakan kembali ke halaman pemilihan event.
                </Alert>
                <Button color="light" onClick={() => router.back()} className="mt-4">
                    <HiArrowLeft className="mr-2 h-5 w-5" /> Kembali
                </Button>
            </div>
         );
    }


    return (
        <div className="flex justify-center min-h-screen py-10 bg-gray-50">
            {/* Component PromotionForm menerima eventId sebagai prop */}
            <PromotionForm eventId={eventId} /> 
        </div>
    );
}