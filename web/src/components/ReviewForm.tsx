"use client";

import React, { useState } from 'react';
import { Card, Button, Textarea, Alert, Rating, RatingStar, Spinner, Label } from 'flowbite-react'; 
import { HiStar, HiInformationCircle } from 'react-icons/hi';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation'; // WAJIB: Import useSearchParams

// Asumsi service ini perlu dibuat untuk memeriksa status DONE user dan submit
import { checkUserAttendanceAndReviewStatus, submitReview } from '@/services/review.service'; 
import { submitReview as submitReviewApi } from '@/services/review.service'; // Asumsi submit API

// --- Interface Data ---
interface ReviewStatus {
    // PERBAIKAN: Masukkan 'NOT_FOUND' ke dalam union type di sini
    // NOTE: Meskipun kita definisikan di sini, TS mungkin mengeluh karena SWR tidak mengembalikannya.
    status: 'DONE' | 'PENDING' | 'EXPIRED' | 'NOT_FOUND'; 
    hasReviewed: boolean;
}

interface ReviewPayload {
    eventId: string;
    rating: number;
    comment?: string;
}
// ----------------------


// Komponen tidak lagi menerima prop eventId, mengambil dari URL
const ReviewForm: React.FC = () => { 
    // --- PERBAIKAN: Ambil eventId dari URL Query ---
    const searchParams = useSearchParams();
    const eventId = searchParams.get('eventId');
    
    // State Form
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    if (!eventId) return <Alert color="failure">Event ID hilang. Tidak bisa memberi ulasan.</Alert>; // Guard ID
    // ---------------------------------------------
    
    // SWR untuk mengecek apakah user sudah hadir dan bisa me-review
    const { data: statusData, isLoading: isStatusLoading, mutate } = useSWR(
        // Kunci SWR bergantung pada eventId
        eventId ? `/reviews/status?eventId=${eventId}` : null, 
        () => checkUserAttendanceAndReviewStatus(eventId)
    );
    
    // --- KASUS LOADING ---
    if (isStatusLoading) return <Spinner size="sm" />;

    // Kondisi Kritis untuk menampilkan form
    // Menggunakan type casting ke string untuk memastikan perbandingan berjalan
    const currentStatus = statusData?.status as string; 
    const canReview = statusData && currentStatus === 'DONE' && !statusData.hasReviewed;
    
    // Logic Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            // 1. Panggil service POST /reviews
            const payload: ReviewPayload = { eventId, rating, comment };
            await submitReviewApi(payload); 
            
            setSuccess('Terima kasih, ulasan Anda berhasil dikirim!');
            mutate(); // Re-fetch status setelah submit untuk menyembunyikan form
        } catch (e: any) {
             setError(e.message || 'Gagal mengirim ulasan.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- LOGIC RENDERING PESAN OTORISASI ---

    if (statusData?.hasReviewed) {
        return <Alert color="info" className="mt-4">Anda sudah memberikan ulasan untuk event ini.</Alert>;
    }
    
    // PERBAIKAN KRITIS: Menggunakan string casting untuk membandingkan status
    if (statusData && !canReview && currentStatus !== 'NOT_FOUND') { 
        // Tampilkan pesan jika status bukan DONE (misal: PENDING, EXPIRED)
        return <Alert color="warning" className="mt-4">Anda dapat memberikan ulasan setelah transaksi tiket Anda berstatus 'Selesai' (DONE).</Alert>;
    }


    return (
        <Card className="p-4 mt-6">
            <h5 className="text-xl font-bold mb-3">Tulis Ulasan Anda</h5>
            {success && <Alert color="success" className="mb-4">{success}</Alert>}
            {error && <Alert color="failure" icon={HiInformationCircle} className="mb-4">{error}</Alert>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Label htmlFor="rating">Rating Anda:</Label>
                    <Rating>
                         {[...Array(5)].map((_, index) => (
                             <RatingStar 
                                 key={index}
                                 filled={index < rating}
                                 onClick={() => setRating(index + 1)}
                                 className="cursor-pointer"
                             />
                         ))}
                    </Rating>
                </div>
                
                <Textarea 
                    placeholder="Apa pendapat Anda tentang event ini?"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={isLoading}
                />
                <Button 
                    type="submit" 
                    size="sm" 
                    disabled={isLoading} 
                >
                    {isLoading ? (
                        <>
                            <Spinner size="sm" className="mr-2" /> Mengirim...
                        </>
                    ) : (
                        'Kirim Ulasan'
                    )}
                </Button>
            </form>
        </Card>
    );
};

export default ReviewForm;