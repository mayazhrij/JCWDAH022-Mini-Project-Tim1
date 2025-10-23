"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Rating, RatingStar, Badge } from 'flowbite-react';
import { HiArrowLeft, HiStar, HiCalendar, HiLocationMarker, HiTicket, HiInformationCircle } from 'react-icons/hi';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';

import { getEventDetail } from '@/services/event.service'; 
import { useAuthStatus } from '@/hooks/useAuthStatus'; 
import ReviewForm from '@/components/ReviewForm'; // Komponen Review
import { EventDetailResponse } from '@/services/event.service'; 

export default function EventDetailPage() {
    const router = useRouter();
    const { isAuthenticated, isInitialLoadComplete, role } = useAuthStatus();
    
    // --- FIX HYDRATION: State untuk Mount ---
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    // ----------------------------------------
    
    // --- MENGAMBIL EVENT ID DARI QUERY PARAMETER ---
    const searchParams = useSearchParams();
    const eventId = searchParams.get('eventId');
    
    // Guard awal: Jika ID event tidak ditemukan di URL
    if (!eventId) {
        return <div className="text-center p-20 min-h-screen text-red-500">
            <Alert color="failure" icon={HiInformationCircle}>Event ID hilang. Tidak dapat memuat detail.</Alert>
        </div>;
    }
    
    // Fetch detail event
    const { data: eventData, error, isLoading } = useSWR(
        eventId ? `/events/${eventId}` : null, 
        () => getEventDetail(eventId)
    );

    // --- LOGIC LOADING & ERROR HANDLING ---
    if (!isInitialLoadComplete || isLoading) {
        return <div className="text-center p-20 min-h-screen"><Spinner size="xl" /><p>Memuat detail event...</p></div>;
    }
    if (error || !eventData) {
        return <div className="text-center p-20 text-red-500"><Alert color="failure">Event tidak ditemukan: {error?.message || 'Error koneksi'}</Alert></div>;
    }

    // --- LOGIC DISPLAY ---
    const avgRating = Number(eventData.ratings?.average) || 0;
    const minPrice = eventData.ticketTypes?.[0]?.ticketPrice || 0;
    const isFree = minPrice === 0;

    // Helper untuk format tanggal (Hanya berjalan di client)
    const formatDate = (dateString: string) => {
        if (!isClient) return '...'; 
        try {
            return new Date(dateString).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };


    return (
        <div className="container mx-auto p-4 md:p-10 max-w-4xl">
            <Button color="light" onClick={() => router.back()} className="mb-6">
                <HiArrowLeft className="mr-2 h-5 w-5" /> Kembali
            </Button>

            <div className="grid md:grid-cols-3 gap-8">
                {/* --- Kolom Kiri: Detail Utama --- */}
                <div className="md:col-span-2">
                    <h1 className="text-4xl font-extrabold mb-4">{eventData.name}</h1>
                    
                    <div className="flex items-center text-gray-600 mb-6 gap-6 text-lg">
                        <div className="flex items-center">
                            <HiCalendar className="mr-2 h-6 w-6 text-blue-500" /> 
                            {isClient ? formatDate(eventData.startDate) : '...'}
                        </div>
                        <div className="flex items-center">
                            <HiLocationMarker className="mr-2 h-6 w-6 text-red-500" /> 
                            {eventData.location}
                        </div>
                    </div>

                    <Card className="mb-6">
                         <h5 className="text-2xl font-bold">Deskripsi Event</h5>
                         <p className="text-gray-700">{eventData.description}</p>
                    </Card>

                    {/* --- Bagian Ulasan --- */}
                    <h2 className="text-2xl font-bold mb-4 mt-8">Ulasan & Rating</h2>
                    
                    {isAuthenticated && role === 'customer' && (
                        <ReviewForm />
                    )}

                    {/* List Ulasan */}
                    {/* PERBAIKAN KRITIS: Melindungi akses .length */}
                    {eventData.reviews?.length === 0 ? ( 
                        <p className="text-gray-500 mt-4">Belum ada ulasan untuk event ini.</p>
                    ) : (
                        <div className="space-y-4 mt-4">
                            {/* Memastikan reviews ada sebelum map */}
                            {eventData.reviews && eventData.reviews.map(review => (
                                <Card key={review.id} className="p-4">
                                    {isClient && (
                                        <div className="flex items-center gap-2 text-yellow-500">
                                            <Rating>
                                                {[...Array(5)].map((_, i) => (
                                                    <RatingStar key={i} filled={i < review.rating} />
                                                ))}
                                            </Rating>
                                            <span className="text-sm text-gray-500">({review.rating})</span>
                                        </div>
                                    )}
                                    <p className="text-gray-700 mt-1">{review.comment}</p>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- Kolom Kanan: Tiket & Checkout --- */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="bg-blue-50">
                        <h5 className="text-xl font-bold text-gray-800">Harga Tiket</h5>
                        <p className="text-3xl font-extrabold text-blue-700">
                            {isFree ? 'GRATIS' : `Rp ${minPrice.toLocaleString('id-ID')}`}
                        </p>
                        {/* PERBAIKAN KRITIS: Menggunakan Optional Chaining pada organizer */}
                        <p className="text-sm text-gray-500 mt-2">Diselenggarakan oleh: {eventData.organizer?.name || 'Unknown Organizer'}</p>
                        
                        {/* Tombol Beli / Login */}
                        <Link href={isAuthenticated 
                            ? `/checkout/${eventData.ticketTypes[0]?.id}` 
                            : '/login'} passHref>
                            <Button className="w-full mt-4" color="blue">
                                <HiTicket className="mr-2 h-5 w-5" /> {isAuthenticated ? 'Beli Tiket' : 'Login untuk Beli Tiket'}
                            </Button>
                        </Link>
                    </Card>

                    {/* Detail Jenis Tiket */}
                    <Card>
                        <h5 className="text-lg font-bold mb-3">Jenis Tiket Tersedia</h5>
                        <div className="space-y-2">
                            {/* Memastikan ticketTypes ada sebelum map */}
                            {eventData.ticketTypes?.map(ticket => (
                                <div key={ticket.id} className="flex justify-between text-sm">
                                    <span className="font-medium">{ticket.ticketName}</span>
                                    <Badge color="info">Sisa: {ticket.quota}</Badge>
                                    <span>{ticket.ticketPrice.toLocaleString('id-ID')} IDR</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Ringkasan Rating Organizer */}
                    <Card className="flex flex-col items-center text-center">
                        <h5 className="text-lg font-bold mb-2">Rating Organizer</h5>
                        <div className="flex items-center gap-2 text-yellow-500 text-2xl">
                             {/* FIX 3: Rating Bintang hanya di-render saat Client mounted */}
                             {isClient ? (
                                <Rating>
                                    {[...Array(5)].map((_, i) => (
                                        <RatingStar key={i} filled={i < Math.round(avgRating)} />
                                    ))}
                                </Rating>
                             ) : 
                                 <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                             }
                            <span className="font-extrabold text-gray-800">{avgRating.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-gray-500">Dari {eventData.ratings?.totalReviews || 0} ulasan</p>
                    </Card>
                </div>
            </div>
        </div>
    );
}

