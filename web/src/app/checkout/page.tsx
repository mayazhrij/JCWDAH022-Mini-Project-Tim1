"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, Checkbox, Label, Alert, Spinner, Modal, TextInput, ModalHeader, ModalBody, ModalFooter, Select } from 'flowbite-react'; // Import Select
import { HiArrowLeft, HiInformationCircle, HiOutlineClock } from 'react-icons/hi';
import { useRouter, useSearchParams } from 'next/navigation'; // WAJIB: Import useSearchParams
import useSWR from 'swr';
import Link from 'next/link';

// Import services dan hooks
import { useAuthStatus } from '@/hooks/useAuthStatus'; 
import { createTransactionApi } from '@/services/transaction.service'; 
import { getTicketDetail, getMyProfile } from '@/services/user.service'; // Asumsi services user/event detail
import { CheckoutBody } from '@/types/transaction'; // Interface CheckoutBody

// Batasan Kuantitas Tiket (Client-side)
const MAX_QUANTITY = 5;

// Halaman Checkout (Menggunakan Query Parameter)
export default function CheckoutPage() {
    const router = useRouter();
    const { isAuthenticated, role, isInitialLoadComplete } = useAuthStatus();
    
    // --- 1. MENGAMBIL ID TIKET DARI QUERY PARAMETER ---
    const searchParams = useSearchParams();
    const ticketTypeId = searchParams.get('ticketId'); // ID Tiket diambil dari Query Parameter
    // ----------------------------------------------------
    
    // State Input
    const [usePoints, setUsePoints] = useState(true);
    const [quantity, setQuantity] = useState(1);
    
    // State KRITIS: Menyimpan ID tiket yang sedang dipilih user
    const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>(ticketTypeId || undefined); 

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [transactionDetail, setTransactionDetail] = useState<any>(null);

    // --- 2. FETCH DATA DARI BACKEND ---
    
    // Fetch detail tiket (gunakan ticketTypeId) dan user (untuk saldo poin)
    const { data: fetchResult, isLoading: isTicketLoading, error: ticketError } = useSWR(
        isInitialLoadComplete && isAuthenticated && ticketTypeId ? `/events/tickets/${ticketTypeId}` : null, 
        () => getTicketDetail(ticketTypeId!)
    );

    const { data: userProfile, isLoading: isProfileLoading } = useSWR(
        isInitialLoadComplete && isAuthenticated ? '/users/profile' : null, 
        getMyProfile 
    );
    
    // --- SINKRONISASI STATE ---
    // Efek untuk menyetel selectedTicketId saat data pertama kali dimuat
    useEffect(() => {
        // Jika fetchResult (data tiket) berhasil dan selectedTicketId belum disetel
        if (fetchResult && !selectedTicketId) {
            setSelectedTicketId(ticketTypeId || undefined); 
        }
    }, [fetchResult, selectedTicketId, ticketTypeId]);


    // --- GUARDS & LOADING ---
    
    if (!isInitialLoadComplete) {
         return <div className="text-center p-20 min-h-screen"><Spinner size="xl" /><p>Memverifikasi sesi...</p></div>;
    }
    if (!isAuthenticated) {
        router.push('/auth/login');
        return null;
    }
    if (role === 'organizer') {
        router.push('/organizer/dashboard');
        return null;
    }
    // Guard: Jika ID Tiket Hilang dari Query Parameter
    if (!ticketTypeId) {
        return <div className="text-center p-20 text-red-500">
            <Alert color="failure" icon={HiInformationCircle}>ID Tiket hilang. Mohon kembali ke halaman event detail.</Alert>
        </div>;
    }


    if (isTicketLoading || isProfileLoading || !selectedTicketId) { 
        return <div className="text-center p-20"><Spinner size="xl" /><p>Memuat Detail Tiket...</p></div>;
    }
    // PERBAIKAN 3: Jika fetch gagal, tampilkan error
    if (ticketError || !fetchResult) {
        return <div className="text-center p-20 text-red-500">Tiket tidak ditemukan atau error server: {ticketError?.message}</div>;
    }
    

    // --- 3. PERHITUNGAN HARGA BERDASARKAN TIKET YANG DIPILIH ---
    
    // PERBAIKAN KRITIS: Mengakses properti langsung dari fetchResult (tanpa .data)
    // Gunakan Optional Chaining dan fallback array kosong saat destructuring
    const fetchedData = fetchResult as any;
    
    const event = fetchedData.event || {};
    const ticketTypes = fetchedData.ticketTypes || []; // <-- FIX: Pastikan ini selalu ARRAY saat destructure

    
    const userPoints = userProfile?.points || 0;
    
    // Cari detail tiket yang sedang aktif/dipilih
    // FIX KRITIS: Melindungi find() dari array kosong/undefined
    const selectedTicket = ticketTypes.find((t: any) => t.id === selectedTicketId) || { ticketPrice: 0, quota: 0, ticketName: 'Tiket Hilang', id: 'default' }; 

    const rawTicketPrice = selectedTicket.ticketPrice || 0;
    const availableQuota = selectedTicket.quota || 0;
    
    const subtotal = rawTicketPrice * quantity;
    
    // Logic Points: Poin digunakan (1:1) tidak melebihi saldo atau harga subtotal
    const pointsUsed = usePoints ? Math.min(userPoints, subtotal) : 0;
    const totalDue = subtotal - pointsUsed;
    const isOutOfStock = quantity > availableQuota;


    // --- 4. HANDLE SUBMIT CHECKOUT ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        if (quantity < 1 || quantity > MAX_QUANTITY || isOutOfStock) {
             setError(`Kuantitas harus valid dan tidak melebihi stok (${availableQuota}).`);
             setIsSubmitting(false);
             return;
        }

        try {
            const payload: CheckoutBody = { 
                ticketTypeId: selectedTicketId!, // Mengirim ID Tiket yang dipilih
                quantity, 
                usePoints: usePoints 
            };
            
            // Panggil API POST /transactions
            const result = await createTransactionApi(payload);

            // Simpan detail transaksi dan tampilkan modal
            setTransactionDetail(result);
            setShowModal(true);
            
        } catch (e: any) {
            setError(e.message || 'Gagal memproses checkout. Cek kuota tiket.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const ticketName = selectedTicket.ticketName || "Tiket";
    const eventName = event.name || "Nama Event";
    

    return (
        <div className="container mx-auto p-4 md:p-10 max-w-2xl">
            {/* Modal Sukses Checkout */}
            {transactionDetail && (
                <TransactionSuccessModal 
                    show={showModal} 
                    transaction={transactionDetail}
                    onClose={() => router.push(`/transactions/my`)} 
                />
            )}

            <Button color="light" onClick={() => router.back()} className="mb-4" disabled={isSubmitting}>
                <HiArrowLeft className="mr-2 h-5 w-5" /> Kembali
            </Button>
            
            <h1 className="text-3xl font-bold mb-6">Konfirmasi Pembelian</h1>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <Card>
                    <h5 className="text-xl font-bold tracking-tight text-gray-900">
                        {ticketName} ({eventName})
                    </h5>
                    
                    {/* KRITIS: Dropdown Pemilihan Jenis Tiket */}
                    <div className="flex flex-col gap-2 border-b pb-4">
                        <Label htmlFor="ticketSelect">Pilih Jenis Tiket</Label>
                        <Select 
                            id="ticketSelect" 
                            value={selectedTicketId} 
                            onChange={(e) => {
                                setSelectedTicketId(e.target.value);
                                setQuantity(1); // Reset kuantitas saat tiket diganti
                            }}
                            disabled={isSubmitting}
                        >
                            {/* FIX: Pastikan ticketTypes adalah array sebelum map */}
                            {ticketTypes.map((ticket: any) => ( 
                                <option key={ticket.id} value={ticket.id}>
                                    {ticket.ticketName} (Rp {ticket.ticketPrice.toLocaleString()})
                                </option>
                            ))}
                        </Select>
                        <p className="text-xs text-red-500 mt-1">Sisa Kuota: {availableQuota}</p>
                    </div>


                    {/* Harga Satuan */}
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Harga Satuan</span>
                        <span className="font-semibold">Rp {rawTicketPrice.toLocaleString('id-ID')}</span>
                    </div>
                    {/* Kuantitas */}
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Kuantitas (Tersisa: {availableQuota})</span>
                        <TextInput 
                            type="number" 
                            min={1} 
                            max={availableQuota} 
                            value={quantity} 
                            onChange={(e) => setQuantity(Number(e.target.value))} 
                            className="w-20" 
                            disabled={isSubmitting || isOutOfStock}
                        />
                    </div>
                    {isOutOfStock && <p className="text-red-500 text-sm">Melebihi kuota tersedia!</p>}
                </Card>

                {/* Point Usage Section */}
                <Card>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Checkbox id="usePoints" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} disabled={isSubmitting || userPoints === 0} />
                            <Label htmlFor="usePoints">Gunakan Poin (Saldo Anda: {userPoints.toLocaleString('id-ID')})</Label>
                        </div>
                        <span className="text-green-600 font-semibold">- Rp {pointsUsed.toLocaleString('id-ID')}</span>
                    </div>
                </Card>

                {/* Ringkasan Pembayaran */}
                <Card className="bg-blue-50">
                    <div className="flex justify-between text-lg font-bold">
                        <span>Subtotal</span>
                        <span className="text-xl">Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-2">
                        <span>Total Pembayaran</span>
                        <span className="2xl text-blue-700">Rp {totalDue.toLocaleString('id-ID')}</span>
                    </div>
                </Card>

                {error && <Alert color="failure" icon={HiInformationCircle}>{error}</Alert>}

                <Button type="submit" disabled={isSubmitting || isOutOfStock} className="mt-4">
                    {isSubmitting ? 'Memproses Pesanan...' : 'Bayar Sekarang'}
                </Button>
            </form>
        </div>
    );
}

// --- Komponen Modal Sukses Transaksi ---

interface ModalProps {
    show: boolean;
    transaction: any;
    onClose: () => void;
}

const TransactionSuccessModal: React.FC<ModalProps> = ({ show, transaction, onClose }) => {
    return (
        <Modal show={show} onClose={onClose} dismissible>
            <ModalHeader>Pesanan Berhasil Dibuat!</ModalHeader>
            <ModalBody>
                <div className="space-y-6">
                    <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                        Tiket Anda berhasil dipesan. Anda memiliki waktu 2 jam untuk menyelesaikan pembayaran.
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                        Total Pembayaran: <span className="text-blue-700">Rp {transaction?.totalPrice.toLocaleString('id-ID') || 0}</span>
                    </p>
                    <div className="flex items-center text-sm text-red-500">
                         <HiOutlineClock className="mr-2 h-5 w-5" /> 
                         Status: Menunggu Pembayaran
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button onClick={onClose}>
                    Lihat Status Transaksi
                </Button>
            </ModalFooter>
        </Modal>
    );
};

