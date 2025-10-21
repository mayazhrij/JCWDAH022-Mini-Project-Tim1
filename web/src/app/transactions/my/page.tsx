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
    const { isAuthenticated, isInitialLoadComplete } = useAuthStatus();
    const router = useRouter();
    
    // Pengecekan tokenExists di client side
    const tokenExists = typeof window !== 'undefined' && localStorage.getItem('jwt_token') !== null;
    
    // --- LOGIC REDIRECT DI useEffect (Side Effect) ---
    useEffect(() => {
        // Redirect hanya jika hook selesai membaca state DAN otentikasi gagal.
        if (isInitialLoadComplete && !isAuthenticated) {
            
            // Hapus token kadaluarsa (jika ada) sebelum redirect (cleanup)
            if (tokenExists) {
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('user_role');
            }
            
            router.push('/auth/login');
        }
    }, [isAuthenticated, isInitialLoadComplete, router]);

    // --- LOGIC RENDERING UTAMA (GUARD) ---
    
    // 1. KASUS LOADING / VERIFIKASI AWAL
    // Tampilkan loading jika hook belum selesai membaca state awal.
    if (!isInitialLoadComplete) { 
        return <div className="text-center p-20"><Spinner size="xl" /><p>Memverifikasi sesi...</p></div>;
    }
    
    // 2. KASUS REDIRECT DIPICU (Jika loading selesai dan otentikasi gagal)
    if (!isAuthenticated) { 
        return null; 
    }
    
    // 3. Render halaman utama jika otentikasi sukses
    if (isAuthenticated) {
        
        // Kunci SWR hanya aktif karena isAuthenticated=true
        const { data: transactions, error, isLoading: isDataLoading } = useSWR('/transactions/my', getMyTransactions);
        
        if (isDataLoading) return <div className="text-center p-20"><Spinner size="xl" /><p>Memuat Riwayat Transaksi...</p></div>;
        
        // --- PERBAIKAN: Tangani Error Token Invalid di SWR ---
        if (error) {
            // Karena fetch SWR gagal (token invalid/expired), ini akan memicu useEffect di atas
            // untuk membersihkan token dan redirect.
            return <div className="text-center p-20 text-red-500">
                <p>Sesi kadaluarsa. Mohon tunggu sebentar, Anda dialihkan...</p>
            </div>;
        }
        // -----------------------------------------------------

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
                                                
                                                {/* PERBAIKAN 1: BUNGKUS NAMA EVENT + TANGGAL */}
                                                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                                    <div> {/* Tambahkan wrapper div */}
                                                        {tx.event.name || 'Nama Event'}
                                                        <div className="text-xs text-gray-500">{new Date(tx.event.startDate).toLocaleDateString()}</div>
                                                    </div>
                                                </TableCell>
                                                
                                                <TableCell>{tx.ticketType.ticketName}</TableCell>
                                                <TableCell>{tx.quantity}</TableCell>
                                                
                                                {/* PERBAIKAN 2: BUNGKUS HARGA TOTAL + POIN */}
                                                <TableCell>
                                                    <div> {/* Tambahkan wrapper div */}
                                                        Rp {tx.totalPrice.toLocaleString('id-ID')}
                                                        {tx.pointsUsage && tx.pointsUsage.usedPoints > 0 && (
                                                            <div className="text-xs text-green-500">(-{tx.pointsUsage.usedPoints.toLocaleString()} Poin)</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                
                                                {/* Kolom Status (Badge) */}
                                                <TableCell>
                                                    <Badge color={status.color} icon={status.icon}>
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                
                                                {/* Kolom Aksi (Button) */}
                                                <TableCell>
                                                    {isWaitingForPayment && (
                                                        <Button size="xs" color="warning" className="w-full" as={Link} href={`/transactions/${tx.id}/upload`}>
                                                            <HiOutlineUpload className="mr-2 h-4 w-4" /> Unggah Bukti
                                                        </Button>
                                                    )}
                                                    {tx.status === 'done' && (
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




