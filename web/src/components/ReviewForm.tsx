"use client";

import React, { useState } from 'react';
import { Card, Button, Textarea, Alert, Rating, RatingStar, Spinner, Label } from 'flowbite-react'; 
import { HiStar, HiInformationCircle } from 'react-icons/hi';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import { checkUserAttendanceAndReviewStatus, submitReview } from '@/services/review.service'; 
import { submitReview as submitReviewApi } from '@/services/review.service';

interface ReviewStatus {
    status: 'DONE' | 'PENDING' | 'EXPIRED' | 'NOT_FOUND'; 
    hasReviewed: boolean;
}

interface ReviewPayload {
    eventId: string;
    rating: number;
    comment?: string;
}

const ReviewForm: React.FC = () => { 
    const searchParams = useSearchParams();
    const eventId = searchParams.get('eventId');
    
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    if (!eventId) return <Alert color="failure">Event ID is missing. Cannot submit review.</Alert>; // Guard ID
    
    const { data: statusData, isLoading: isStatusLoading, mutate } = useSWR(
        eventId ? `/reviews/status?eventId=${eventId}` : null, 
        () => checkUserAttendanceAndReviewStatus(eventId)
    );

    if (isStatusLoading) return <Spinner size="sm" />;

    const currentStatus = statusData?.status as string; 
    const canReview = statusData && currentStatus === 'DONE' && !statusData.hasReviewed;
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const payload: ReviewPayload = { eventId, rating, comment };
            await submitReviewApi(payload); 

            setSuccess('Thank you, your review has been submitted successfully!');
            mutate();
        } catch (e: any) {
             setError(e.message || 'Failed to submit review.');
        } finally {
            setIsLoading(false);
        }
    };

    if (statusData?.hasReviewed) {
        return <Alert color="info" className="mt-4">You have already submitted a review for this event.</Alert>;
    }
    
    if (statusData && !canReview && currentStatus !== 'NOT_FOUND') { 
        return <Alert color="warning" className="mt-4">You can only leave a review after your ticket transaction is 'Done'.</Alert>;
    }


    return (
        <Card className="p-4 mt-6">
            <h5 className="text-xl font-bold mb-3">Write Your Review</h5>
            {success && <Alert color="success" className="mb-4">{success}</Alert>}
            {error && <Alert color="failure" icon={HiInformationCircle} className="mb-4">{error}</Alert>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Label htmlFor="rating">Your rating for this event:</Label>
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
                    placeholder="What do you think about this event?"
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
                            <Spinner size="sm" className="mr-2" /> Sending...
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