"use client";

import { useAuthStatus } from '@/hooks/useAuthStatus'; 
import { useRouter } from 'next/navigation';
import { Spinner, Table, Card, Badge, Button } from 'flowbite-react';
import React, { useEffect } from 'react'; 
import { HiCheckCircle, HiExclamation, HiXCircle, HiOutlineUpload } from 'react-icons/hi';
import { getMyTransactions } from '@/services/transaction.service'; 
import useSWR from 'swr';
import Link from 'next/link';

// Import komponen anak Table dari Flowbite React
import { TableHead, TableHeadCell, TableBody, TableRow, TableCell } from 'flowbite-react'; 

// Interface Status Mapping (Untuk pewarnaan tampilan)
const STATUS_MAP: Record<string, { color: string, icon: React.FC, label: string }> = {
    waiting_payment: { color: 'warning', icon: HiExclamation, label: 'Menunggu Pembayaran' },
    waiting_confirmation: { color: 'info', icon: HiExclamation, label: 'Menunggu Konfirmasi' },
    done: { color: 'success', icon: HiCheckCircle, label: 'Selesai (Tiket Aktif)' },
    rejected: { color: 'failure', icon: HiXCircle, label: 'Ditolak' },
    expired: { color: 'failure', icon: HiXCircle, label: 'Kadaluarsa' },
    canceled: { color: 'failure', icon: HiXCircle, label: 'Dibatalkan' },
};


export default function MyTransactionsPage() {
    // Ambil status dari hook yang sudah disinkronkan
    const { isAuthenticated, isLoading, isInitialLoadComplete } = useAuthStatus();
    const router = useRouter();
    
    // Pengecekan tokenExists di client side
    const tokenExists = typeof window !== 'undefined' && localStorage.getItem('jwt_token') !== null;
    
    // --- LOGIC REDIRECT DI useEffect (Side Effect) ---
    useEffect(() => {
        // Redirect hanya jika loading selesai DAN otentikasi gagal.
        // Jika loading sudah selesai, dan tidak ada otentikasi, redirect user.
        if (isInitialLoadComplete && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isInitialLoadComplete, router]);

    // --- LOGIC RENDERING UNTUK MENGHINDARI CRASH ---
    
    // 1. KASUS LOADING / VERIFIKASI AWAL
    // Tampilkan loading jika hook belum selesai memverifikasi TAPI ada token (untuk menutupi race condition).
    if (isLoading || !isInitialLoadComplete) {
        return <div className="text-center p-20"><Spinner size="xl" /><p>Memverifikasi sesi...</p></div>;
    }
    
    // 2. KASUS REDIRECT DIPICU (User tidak login/tidak ada token)
    // Jika loading selesai dan otentikasi gagal, return null (redirect sedang diproses di useEffect).
    if (!isAuthenticated) { 
        return null; 
    }
    
    // 3. Render halaman utama jika otentikasi sukses
    if (isAuthenticated) {
        // --- LOGIC SWR FETCH TRANSACTIONS DI SINI ---
        
        // Kunci SWR sekarang dijamin aktif karena isAuthenticated = true
        const { data: transactions, error, isLoading: isDataLoading } = useSWR('/transactions/my', getMyTransactions);
        
        if (isDataLoading) return <div className="text-center p-20"><Spinner size="xl" /><p>Memuat Riwayat Transaksi...</p></div>;
        if (error) return <div className="text-center p-20 text-red-500">Gagal memuat transaksi: {error.message}</div>;

        const transactionsList = transactions?.data || [];

        return (
            <div className="container mx-auto p-4 md:p-10">
                <h1 className="text-3xl font-bold mb-6">Tiket dan Riwayat Transaksi Saya</h1>
                
                <Card>
                    {transactionsList.length === 0 ? (
                        <p className="text-center text-gray-500">Anda belum memiliki transaksi. <Link href="/" className="text-blue-600 hover:underline">Cari event sekarang!</Link></p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table hoverable>
                                <TableHead>
                                    <TableHeadCell>Event</TableHeadCell>
                                    <TableHeadCell>Tiket</TableHeadCell>
                                    <TableHeadCell>Kuantitas</TableHeadCell>
                                    <TableHeadCell>Total Bayar</TableHeadCell>
                                    <TableHeadCell>Status</TableHeadCell>
                                    <TableHeadCell>Aksi</TableHeadCell>
                                </TableHead>
                                <TableBody className="divide-y">
                                    {transactionsList.map((tx: any) => {
                                        const status = STATUS_MAP[tx.status] || { color: 'gray', icon: HiExclamation, label: 'Tidak Diketahui' };
                                        const isWaitingForPayment = tx.status === 'waiting_payment';
                                        
                                        return (
                                            <TableRow key={tx.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                                    {tx.event.name || 'Nama Event'}
                                                    <div className="text-xs text-gray-500">{new Date(tx.event.startDate).toLocaleDateString()}</div>
                                                </TableCell>
                                                <TableCell>{tx.ticketType.ticketName}</TableCell>
                                                <TableCell>{tx.quantity}</TableCell>
                                                <TableCell>
                                                    Rp {tx.totalPrice.toLocaleString('id-ID')}
                                                    {tx.pointsUsage && tx.pointsUsage.usedPoints > 0 && (
                                                        <div className="text-xs text-green-500">(-{tx.pointsUsage.usedPoints.toLocaleString()} Poin)</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge color={status.color} icon={status.icon}>
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {isWaitingForPayment && (
                                                        // Route ke halaman upload bukti bayar
                                                        <Button size="xs" color="warning" className="w-full" as={Link} href={`/transactions/${tx.id}/upload`}>
                                                            <HiOutlineUpload className="mr-2 h-4 w-4" /> Unggah Bukti
                                                        </Button>
                                                    )}
                                                    {tx.status === 'done' && (
                                                        // TODO: Link ke E-Ticket
                                                        <Button size="xs" color="success" className="w-full">
                                                            Lihat E-Ticket
                                                        </Button>
                                                    )}
                                                    {(tx.status === 'rejected' || tx.status === 'expired') && (
                                                        <div className="text-xs text-red-500">Rollback Selesai</div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>
            </div>
        );
    }

    // Default Fallback
    return null; 
}




