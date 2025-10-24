"use client";

import { Card, Badge, Button, Spinner, Alert } from 'flowbite-react';
import React, { useState, useEffect } from 'react'; 
import { HiInformationCircle, HiArrowLeft } from 'react-icons/hi';
import useSWR from 'swr';
import Link from 'next/link';
import { getMyTransactions } from '@/services/transaction.service'; 

const STATUS_MAP: Record<string, { color: string, label: string }> = {
    waiting_payment: { color: 'warning', label: 'Waiting for Payment' },
    waiting_confirmation: { color: 'info', label: 'Waiting Organizer Confirmation' },
    done: { color: 'success', label: 'Done (Ticket is Active)' },
    rejected: { color: 'failure', label: 'Rejected' },
    expired: { color: 'failure', label: 'Expired' },
    canceled: { color: 'failure', label: 'Canceled' },
};

// Fungsi format tanggal (tetap sama)
const formatClientDate = (dateString: string) => {
    if (typeof window !== 'undefined') {
        try {
            return new Date(dateString).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        } catch {
            return dateString;
        }
    }
    return dateString;
};

export default function TransactionFlow() {
    
    // Gunakan state untuk menentukan apakah client sudah mounted
    const [isClient, setIsClient] = useState(false);
    
    // Set isClient setelah mount (fix hydration)
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const { data: transactions, error, isLoading } = useSWR('/transactions/my', getMyTransactions);
    
    // --- KASUS LOADING / ERROR ---
    if (isLoading || !isClient) return <div className="text-center p-20 min-h-screen"><Spinner size="xl" /><p>{isClient ? 'Memuat Riwayat Transaksi...' : 'Memverifikasi sesi...'}</p></div>;
    
    if (error) return (
        <Alert color="failure" icon={HiInformationCircle} className="mx-auto max-w-4xl mt-10">
            <span className="font-medium">Failed to load transactions.</span> {error.message}. Please try logging in again.
        </Alert>
    );

    const transactionsList = transactions?.data || [];

    return (
        <div className="container mx-auto p-4 md:p-10 max-w-4xl w-full min-h-screen"> 
        <Link href="/" passHref>
                    <Button color="light" className="mb-6">
                        <HiArrowLeft className="mr-2 h-5 w-5" /> Back to Homepage
                    </Button>
                </Link>
            <h1 className="text-3xl font-bold mb-6">My Tickets and Transaction History</h1>
            
            <Card className="w-full relative z-0"> 
                {transactionsList.length === 0 ? (
                    <p className="text-center text-gray-500">
                        You have no transactions yet. <Link href="/" className="text-blue-600 hover:underline">Search event now!</Link>
                    </p>
                ) : (
                    <div className="overflow-x-auto w-full min-h-[200px] relative z-10"> 
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3 min-w-[180px]">Event</th> 
                                    <th scope="col" className="px-6 py-3 min-w-[120px]">Tickets</th>
                                    <th scope="col" className="px-6 py-3 min-w-[80px]">Quantity</th>
                                    <th scope="col" className="px-6 py-3 min-w-[150px]">Total Payment</th>
                                    <th scope="col" className="px-6 py-3 min-w-[130px]">Status</th>
                                    <th scope="col" className="px-6 py-3 min-w-[140px]">Action</th>
                                </tr>
                            </thead>
                            
                            <tbody>
                                {transactionsList.map((tx: any) => {
                                    const status = STATUS_MAP[tx.status as string] || { color: 'gray', label: 'Unknown' };
                                    const isWaitingForPayment = tx.status === 'waiting_payment';
                                    
                                    return (
                                        <tr key={tx.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                            
                                            {/* Data Event */}
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 min-w-[180px]">
                                                <div>
                                                    {tx.event.name || 'Nama Event'}
                                                    <div className="text-xs text-gray-500">{formatClientDate(tx.event.startDate)}</div>
                                                </div>
                                            </td>
                                            
                                            <td className="px-6 py-4 min-w-[120px]">{tx.ticketType.ticketName}</td>
                                            <td className="px-6 py-4 min-w-[80px]">{tx.quantity}</td>
                                            
                                            <td className="px-6 py-4 min-w-[150px]">
                                                <div> 
                                                    Rp {tx.totalPrice.toLocaleString('id-ID')}
                                                    {tx.pointsUsage && tx.pointsUsage.usedPoints > 0 && (
                                                        <div className="text-xs text-green-500">(-{tx.pointsUsage.usedPoints.toLocaleString()} Point)</div>
                                                    )}
                                                </div>
                                            </td>
                                            
                                            <td className="px-6 py-4 min-w-[130px]">
                                                <Badge color={status.color}>{status.label}</Badge>
                                            </td>
                                            
                                            <td className="px-6 py-4 min-w-[140px]"> 
                                                {isWaitingForPayment && (
                                                    <Button size="xs" color="warning" className="w-full" as={Link} 
                                                    href={`/transactions/payment-proof?txId=${tx.id}`}
                                                    >
                                                    Upload Payment Proof
                                                    </Button>
                                                )}
                                                {tx.status === 'done' && (
                                                    <Button size="xs" color="success" className="w-full">Transaction Done</Button>
                                                )}
                                                {(tx.status === 'rejected' || tx.status === 'expired') && (
                                                    <div className="text-xs text-red-500">Rollback Finished</div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {/* ---------------------------------------------------- */}
                    </div>
                )}
            </Card>
        </div>
    );
}