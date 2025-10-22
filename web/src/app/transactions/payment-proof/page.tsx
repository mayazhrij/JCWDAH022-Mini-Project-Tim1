"use client";

import React, { useState } from 'react';
import { Card, Button, FileInput, Label, Alert, Spinner } from 'flowbite-react';
import { HiArrowLeft, HiInformationCircle, HiCloudUpload } from 'react-icons/hi';
import { useRouter, useSearchParams } from 'next/navigation'; // WAJIB: Import useSearchParams
import Link from 'next/link';

// Asumsi: Service sudah diimplementasikan di transaction.service.ts
import { uploadPaymentProofApi } from '@/services/transaction.service'; 
import { useAuthStatus } from '@/hooks/useAuthStatus'; 

// Halaman ini tidak lagi menggunakan params.id dari URL path, tapi dari query parameter
export default function UploadPaymentPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    
    // --- PERBAIKAN: Mengambil ID dari QUERY PARAMETER ---
    const searchParams = useSearchParams();
    const transactionId = searchParams.get('txId'); // <-- ID diambil dari Query Parameter
    // ------------------------------------
    
    const { isAuthenticated, isInitialLoadComplete } = useAuthStatus();
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Guard: Jika belum selesai loading atau belum authenticated, blokir akses
    if (!isInitialLoadComplete || !isAuthenticated) {
        return <div className="text-center p-20 min-h-screen"><Spinner size="xl" /><p>Memverifikasi sesi...</p></div>;
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedFile) {
            setError('Mohon pilih file bukti pembayaran.');
            return;
        }
        // Validasi ID Mutlak
        if (!transactionId) {
             setError('Error: ID Transaksi tidak ditemukan. Mohon kembali ke riwayat.');
             return;
        }

        setIsLoading(true);
        try {
            // Panggil API Upload
            // Mengirim ID Transaksi yang diambil dari query parameter
            await uploadPaymentProofApi(transactionId, selectedFile); 
            
            setSuccess('Bukti pembayaran berhasil diunggah! Anda akan dialihkan.');
            
            setTimeout(() => {
                router.push('/transactions/my');
            }, 2000);

        } catch (e: any) {
            // Tampilkan error dari backend
            setError(e.message || 'Gagal mengunggah bukti. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center min-h-screen py-10 bg-gray-50">
            <Card className="max-w-md w-full">
                <h1 className="text-2xl font-bold text-center mb-6">Unggah Bukti Pembayaran</h1>
                {/* Tampilkan ID Transaksi yang sedang diproses */}
                <p className="text-center text-sm text-gray-600 mb-6">ID Transaksi: {transactionId || 'Menunggu ID...'}</p> 

                {error && <Alert color="failure" icon={HiInformationCircle} className="mb-4">{error}</Alert>}
                {success && <Alert color="success" className="mb-4">{success}</Alert>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="file-upload">Pilih File Bukti (Max 2MB)</Label>
                        </div>
                        <FileInput 
                            id="file-upload" 
                            accept="image/png, image/jpeg, application/pdf"
                            onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                            disabled={isLoading}
                        />
                         <div className="mt-2 text-sm text-gray-500">
                             {selectedFile ? selectedFile.name : 'JPEG, PNG, atau PDF'}
                        </div>
                    </div>
                    
                    <Button 
                        type="submit" 
                        disabled={isLoading || !selectedFile || !transactionId} // Tambahkan !transactionId di disabled
                        className="mt-2"
                    >
                        <HiCloudUpload className="mr-2 h-5 w-5" />
                        {isLoading ? 'Mengunggah...' : 'Konfirmasi Upload'}
                    </Button>
                    
                    <Link href="/transactions/my" passHref>
                        <Button color="light" size="sm">
                            <HiArrowLeft className="mr-2 h-5 w-5" /> Kembali ke Riwayat
                        </Button>
                    </Link>
                </form>
            </Card>
        </div>
    );
}

