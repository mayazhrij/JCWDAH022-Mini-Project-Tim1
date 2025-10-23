"use client";

import React, { useState } from 'react';
import { Card, Label, TextInput, Textarea, Button, Alert, Spinner } from 'flowbite-react';
import { HiInformationCircle, HiPlus, HiArrowLeft, HiTrash } from 'react-icons/hi';
import { createPromotionApi } from '@/services/promotion.service'; 
import { PromotionCreationBody } from '@/types/event'; 
// Asumsi Anda punya service untuk UPDATE EVENT
import { updateEventApi } from '@/services/event.service'; 
import { useRouter } from 'next/navigation';

// Interface untuk state dinamis tiket baru
interface TicketInput {
    ticketName: string;
    ticketPrice: number | '';
    quota: number | '';
}

export default function PromotionForm({ eventId }: { eventId: string }) {
    // State form Promosi Waktu
    const [promoData, setPromoData] = useState<Omit<PromotionCreationBody, 'eventId'>>({
        title: '', description: '', startDate: '', endDate: '',
    });
    
    // State KRITIS: Array untuk Tiket Promosi BARU
    const [newTickets, setNewTickets] = useState<TicketInput[]>([
        { ticketName: 'Promosi Spesial', ticketPrice: '', quota: '' }
    ]);
    
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // --- LOGIC ARRAY TICKET DINAMIS ---
    const handleTicketChange = (index: number, field: keyof TicketInput, value: string | number) => {
        const updatedTickets = [...newTickets];
        updatedTickets[index] = { ...updatedTickets[index], [field]: value };
        setNewTickets(updatedTickets);
    };

    const addTicketType = () => {
        setNewTickets(prevTickets => [
            ...prevTickets,
            { ticketName: 'Tiket Diskon Baru', ticketPrice: '', quota: '' }
        ]);
    };

    const removeTicketType = (index: number) => {
        setNewTickets(prevTickets => prevTickets.filter((_, i) => i !== index));
    };

    
    // --- PERBAIKAN KRITIS: FUNGSI HANDLE CHANGE PROMODATA ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // MENGGANTI setFormData menjadi setPromoData dan formData menjadi promoData
        setPromoData({ ...promoData, [e.target.id]: e.target.value });
    };
    // --------------------------------------------------------


    // --- LOGIC SUBMIT FINAL ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        // 1. Validasi Input Tiket
        const invalidTicket = newTickets.some(t => !t.ticketName || t.ticketPrice === '' || t.quota === '');
        if (invalidTicket) {
            setError('Semua field Tiket Promosi wajib diisi.');
            setIsLoading(false);
            return;
        }

        // 2. Format Data Tiket untuk Backend
        const formattedTickets = newTickets.map(t => ({
            ticketName: t.ticketName,
            ticketPrice: Number(t.ticketPrice),
            quota: Number(t.quota),
        }));

        try {
            // --- A. SIMPAN RECORD PROMOSI WAKTU ---
            const promoPayload: PromotionCreationBody = {
                ...promoData,
                eventId: eventId, 
                startDate: new Date(promoData.startDate).toISOString(), 
                endDate: new Date(promoData.endDate).toISOString(),
            } as PromotionCreationBody;
            await createPromotionApi(promoPayload);


            // --- B. TAMBAHKAN TIKET PROMOSI BARU KE EVENT ---
            await updateEventApi(eventId, { newTicketTypes: formattedTickets });

            
            setSuccessMessage('Promosi dan Tiket Diskon berhasil dibuat! Anda dialihkan.');
            
            // Redirect setelah sukses
            setTimeout(() => {
                router.push('/organizer/dashboard');
            }, 2000);

        } catch (e: any) {
            setError(e.message || 'Gagal membuat promosi dan tiket.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card className="mt-6 max-w-4xl w-full">
            <h5 className="text-2xl font-bold border-b pb-2 text-gray-700">Buat Promosi & Tiket Diskon</h5>
            <p className="text-sm text-gray-500 mb-4">Langkah 1: Tentukan periode promosi. Langkah 2: Tambahkan tiket harga diskon.</p>
            
            {/* Messages */}
            {error && <Alert color="failure" icon={HiInformationCircle} className="mb-4">{error}</Alert>}
            {successMessage && <Alert color="success" className="mb-4">{successMessage}</Alert>}

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                
                {/* --- BAGIAN 1: PERIODE PROMOSI --- */}
                <h2 className="text-xl font-semibold text-gray-700">Periode Promosi</h2>
                {/* Judul Promosi */}
                <div>
                    <Label htmlFor="title">Judul Promosi</Label>
                    <TextInput id="title" required placeholder="Early Bird Spesial" value={promoData.title} onChange={handleChange} disabled={isLoading} />
                </div>
                {/* Tanggal Mulai dan Berakhir */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="startDate">Tanggal Mulai Promosi</Label>
                        <TextInput id="startDate" type="datetime-local" required value={promoData.startDate} onChange={handleChange} disabled={isLoading} />
                    </div>
                    <div>
                        <Label htmlFor="endDate">Tanggal Berakhir Promosi</Label>
                        <TextInput id="endDate" type="datetime-local" required value={promoData.endDate} onChange={handleChange} disabled={isLoading} />
                    </div>
                </div>
                
                {/* --- BAGIAN 2: TIKET DISKON BARU --- */}
                <h2 className="text-xl font-semibold border-t pt-6 text-gray-700">Jenis Tiket Diskon Baru</h2>

                {newTickets.map((ticket, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-3 border p-4 rounded-lg bg-yellow-50">
                        {/* Nama Tiket */}
                        <div className="md:col-span-3">
                            <Label htmlFor={`tname-${index}`}>Nama Tiket</Label>
                            <TextInput id={`tname-${index}`} required placeholder="Contoh: Diskon 25%" value={ticket.ticketName} onChange={(e) => handleTicketChange(index, 'ticketName', e.target.value)} disabled={isLoading} />
                        </div>
                        {/* Harga */}
                        <div className="md:col-span-2">
                            <Label htmlFor={`tprice-${index}`}>Harga (IDR Diskon)</Label>
                            <TextInput id={`tprice-${index}`} type="number" required min={1} placeholder="150000" value={ticket.ticketPrice} onChange={(e) => handleTicketChange(index, 'ticketPrice', e.target.value)} disabled={isLoading} />
                        </div>
                        {/* Kuota */}
                        <div className="md:col-span-1">
                            <Label htmlFor={`tquota-${index}`}>Kuota</Label>
                            <TextInput id={`tquota-${index}`} type="number" required min={1} placeholder="50" value={ticket.quota} onChange={(e) => handleTicketChange(index, 'quota', e.target.value)} disabled={isLoading} />
                        </div>
                        
                        {/* Tombol Hapus */}
                        <div className="md:col-span-1 flex items-end justify-center">
                            {newTickets.length > 1 && (
                                <Button color="failure" size="sm" onClick={() => removeTicketType(index)} disabled={isLoading}>
                                    <HiTrash className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Tombol Tambah Tiket */}
                <Button color="light" size="sm" onClick={addTicketType} disabled={isLoading} className="mt-2 self-start">
                    <HiPlus className="mr-2 h-5 w-5" />
                    Tambahkan Jenis Tiket Diskon
                </Button>

                {/* --- TOMBOL SUBMIT FINAL --- */}
                <Button type="submit" className="mt-4" disabled={isLoading}>
                    {isLoading ? 'Menyimpan Event & Promosi...' : 'Simpan Promosi & Tiket Baru'}
                </Button>
                
                <Button type="button" color="light" onClick={() => router.back()} disabled={isLoading}>
                   <HiArrowLeft className="mr-2 h-5 w-5" /> Kembali
                </Button>

            </form>
        </Card>
    );
}