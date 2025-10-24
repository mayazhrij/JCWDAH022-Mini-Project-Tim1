"use client";

import React, { useState } from 'react';
import { Card, Button, FileInput, Label, Alert, Spinner } from 'flowbite-react';
import { HiArrowLeft, HiInformationCircle, HiCloudUpload } from 'react-icons/hi';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { uploadPaymentProofApi } from '@/services/transaction.service'; 
import { useAuthStatus } from '@/hooks/useAuthStatus'; 

export default function UploadPaymentPage({ params }: { params: { id: string } }) {
    const router = useRouter();

    const searchParams = useSearchParams();
    const transactionId = searchParams.get('txId');
    
    const { isAuthenticated, isInitialLoadComplete } = useAuthStatus();
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isInitialLoadComplete || !isAuthenticated) {
        return <div className="text-center p-20 min-h-screen"><Spinner size="xl" /><p>Verifying Session...</p></div>;
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedFile) {
            setError('Please select a payment proof screenshot to upload.');
            return;
        }
        if (!transactionId) {
             setError('Error: Transaction ID not found. Please return to history.');
             return;
        }

        setIsLoading(true);
        try {
            await uploadPaymentProofApi(transactionId, selectedFile);
            setSuccess('Payment proof uploaded successfully! You will be redirected.');
            setTimeout(() => {
                router.push('/transactions/my');
            }, 2000);

        } catch (e: any) {
            setError(e.message || 'Failed to upload payment proof. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center min-h-screen py-10 bg-gray-50">
            <Card className="max-w-md w-full">
                <h1 className="text-2xl font-bold text-center mb-6">Upload Payment Proof</h1>
                <p className="text-center text-sm text-gray-600 mb-6">Transaction ID: {transactionId || 'Waiting for ID...'}</p>

                {error && <Alert color="failure" icon={HiInformationCircle} className="mb-4">{error}</Alert>}
                {success && <Alert color="success" className="mb-4">{success}</Alert>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="file-upload">Select Payment Proof (Max 2MB)</Label>
                        </div>
                        <FileInput 
                            id="file-upload" 
                            accept="image/png, image/jpeg, application/pdf"
                            onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                            disabled={isLoading}
                        />
                         <div className="mt-2 text-sm text-gray-500">
                             {selectedFile ? selectedFile.name : 'JPEG, PNG, or PDF'}
                        </div>
                    </div>
                    
                    <Button 
                        type="submit" 
                        disabled={isLoading || !selectedFile || !transactionId}
                        className="mt-2"
                    >
                        <HiCloudUpload className="mr-2 h-5 w-5" />
                        {isLoading ? 'Uploading...' : 'Upload Confirmed'}
                    </Button>
                    
                    <Link href="/transactions/my" passHref>
                        <Button color="light" size="sm">
                            <HiArrowLeft className="mr-2 h-5 w-5" /> Back to Transaction History
                        </Button>
                    </Link>
                </form>
            </Card>
        </div>
    );
}

