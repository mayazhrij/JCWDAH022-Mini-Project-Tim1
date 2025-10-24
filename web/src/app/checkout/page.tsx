"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, Checkbox, Label, Alert, Spinner, Modal, TextInput, ModalHeader, ModalBody, ModalFooter, Select } from 'flowbite-react'; // Import Select
import { HiArrowLeft, HiInformationCircle, HiOutlineClock } from 'react-icons/hi';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';

import { useAuthStatus } from '@/hooks/useAuthStatus'; 
import { createTransactionApi } from '@/services/transaction.service'; 
import { getTicketDetail, getMyProfile } from '@/services/user.service';
import { CheckoutBody } from '@/types/transaction';

const MAX_QUANTITY = 5;

export default function CheckoutPage() {
    const router = useRouter();
    const { isAuthenticated, role, isInitialLoadComplete } = useAuthStatus();
    
    const searchParams = useSearchParams();
    const ticketTypeId = searchParams.get('ticketId');
    
    const [usePoints, setUsePoints] = useState(true);
    const [quantity, setQuantity] = useState(1);
    
    const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>(ticketTypeId || undefined); 

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [transactionDetail, setTransactionDetail] = useState<any>(null);


    const { data: fetchResult, isLoading: isTicketLoading, error: ticketError } = useSWR(
        isInitialLoadComplete && isAuthenticated && ticketTypeId ? `/events/tickets/${ticketTypeId}` : null, 
        () => getTicketDetail(ticketTypeId!)
    );

    const { data: userProfile, isLoading: isProfileLoading } = useSWR(
        isInitialLoadComplete && isAuthenticated ? '/users/profile' : null, 
        getMyProfile 
    );
    

    useEffect(() => {
        if (fetchResult && !selectedTicketId) {
            setSelectedTicketId(ticketTypeId || undefined); 
        }
    }, [fetchResult, selectedTicketId, ticketTypeId]);


    
    if (!isInitialLoadComplete) {
         return <div className="text-center p-20 min-h-screen"><Spinner size="xl" /><p>Session Verifying...</p></div>;
    }
    if (!isAuthenticated) {
        router.push('/login');
        return null;
    }
    if (role === 'organizer') {
        router.push('/organizer/dashboard');
        return null;
    }

    if (!ticketTypeId) {
        return <div className="text-center p-20 text-red-500">
            <Alert color="failure" icon={HiInformationCircle}>Ticket ID missing. Please return to the event details page.</Alert>
        </div>;
    }


    if (isTicketLoading || isProfileLoading || !selectedTicketId) { 
        return <div className="text-center p-20"><Spinner size="xl" /><p>Loading Ticket Details...</p></div>;
    }
    // PERBAIKAN 3: Jika fetch gagal, tampilkan error
    if (ticketError || !fetchResult) {
        return <div className="text-center p-20 text-red-500">Ticket not found or server error: {ticketError?.message}</div>;
    }
    


    const fetchedData = fetchResult as any;
    
    const event = fetchedData.event || {};
    const ticketTypes = fetchedData.ticketTypes || []; 
    const userPoints = userProfile?.points || 0;
    const selectedTicket = ticketTypes.find((t: any) => t.id === selectedTicketId) || { ticketPrice: 0, quota: 0, ticketName: 'Ticket is missing', id: 'default' }; 

    const rawTicketPrice = selectedTicket.ticketPrice || 0;
    const availableQuota = selectedTicket.quota || 0;
    
    const subtotal = rawTicketPrice * quantity;
    
    const pointsUsed = usePoints ? Math.min(userPoints, subtotal) : 0;
    const totalDue = subtotal - pointsUsed;
    const isOutOfStock = quantity > availableQuota;


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
                ticketTypeId: selectedTicketId!,
                quantity, 
                usePoints: usePoints 
            };
            
            const result = await createTransactionApi(payload);

            setTransactionDetail(result);
            setShowModal(true);
            
        } catch (e: any) {
            setError(e.message || 'Failed to process checkout. Check ticket quota.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const ticketName = selectedTicket.ticketName || "Tiket";
    const eventName = fetchedData.name || "Nama Event";
    

    return (
        <div className="container mx-auto p-4 md:p-10 max-w-2xl">
            
            {transactionDetail && (
                <TransactionSuccessModal 
                    show={showModal} 
                    transaction={transactionDetail}
                    onClose={() => router.push(`/transactions/my`)} 
                />
            )}

            <Button color="light" onClick={() => router.back()} className="mb-4" disabled={isSubmitting}>
                <HiArrowLeft className="mr-2 h-5 w-5" /> Back
            </Button>
            
            <h1 className="text-3xl font-bold mb-6">Purchase Confirmation</h1>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <Card>
                    <h5 className="text-xl font-bold tracking-tight text-gray-900">
                        {ticketName} ({eventName})
                    </h5>
                    
                    {/* KRITIS: Dropdown Pemilihan Jenis Tiket */}
                    <div className="flex flex-col gap-2 border-b pb-4">
                        <Label htmlFor="ticketSelect">Select Ticket Type</Label>
                        <Select 
                            id="ticketSelect" 
                            value={selectedTicketId} 
                            onChange={(e) => {
                                setSelectedTicketId(e.target.value);
                                setQuantity(1);
                            }}
                            disabled={isSubmitting}
                        >

                            {ticketTypes.map((ticket: any) => ( 
                                <option key={ticket.id} value={ticket.id}>
                                    {ticket.ticketName} (Rp {ticket.ticketPrice.toLocaleString()})
                                </option>
                            ))}
                        </Select>
                        <p className="text-xs text-red-500 mt-1">Available Quota: {availableQuota}</p>
                    </div>


                    {/* Harga Satuan */}
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Maximum Order Quantity is 5 tickets</span>
                       </div> 
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Price</span>
                        <span className="font-semibold">Rp {rawTicketPrice.toLocaleString('id-ID')}</span>
                    </div>
                    
                    
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Quantity (Available: {availableQuota})</span>
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
                    {isOutOfStock && <p className="text-red-500 text-sm">Exceeds available quota!</p>}
                </Card>

                {/* Point Usage Section */}
                <Card>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Checkbox id="usePoints" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} disabled={isSubmitting || userPoints === 0} />
                            <Label htmlFor="usePoints">Use Points (Your Points: {userPoints.toLocaleString('id-ID')})</Label>
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
                        <span>Total Payment</span>
                        <span className="2xl text-blue-700">Rp {totalDue.toLocaleString('id-ID')}</span>
                    </div>
                </Card>

                <Card className="bg-blue-50">
                    <div className="flex justify-between font-bold mt-2">
                        <span>Payment Address</span>
                        <span>March Bank 3542564454 on behalf of Tickety Company</span>
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
                        Your ticket has been successfully booked. You have 2 hours to complete the payment.
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                        Total Payment: <span className="text-blue-700">Rp {transaction?.totalPrice.toLocaleString('id-ID') || 0}</span>
                    </p>
                    <div className="flex items-center text-sm text-red-500">
                         <HiOutlineClock className="mr-2 h-5 w-5" /> 
                         Status: Waiting Payment
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button onClick={onClose}>
                    View Transaction Status
                </Button>
            </ModalFooter>
        </Modal>
    );
};

