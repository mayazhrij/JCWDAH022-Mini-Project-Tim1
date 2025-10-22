"use client";

import React, { useState } from 'react';
import { Card, Label, TextInput, Textarea, Button, Alert } from 'flowbite-react';
import { HiInformationCircle, HiPlus, HiTrash } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { createEventApi } from '@/services/event.service'; 
import { EventCreationBody } from '@/types/event';
import Header from '@/components/Headers';

let ticketIdCounter = 1;
// Interface untuk state dinamis tiket
interface TicketState {
    id: number; // Untuk key React dan manipulasi array
    ticketName: string;
    ticketPrice: number | '';
    quota: number | '';
}

export default function CreateEventPage() {
    // --- PERBAIKAN 1: HAPUS priceIdr dari Initial State ---
    const [eventData, setEventData] = useState<Omit<EventCreationBody, 'ticketTypes'>>({
        name: '', description: '', category: '', location: '', startDate: '', endDate: '', 
        // priceIdr: 0 dihapus karena dihitung di backend
    });
    const [ticketTypes, setTicketTypes] = useState<TicketState[]>([
        { id: ticketIdCounter++, ticketName: 'Regular', ticketPrice: '', quota: '' } // Gunakan counter
    ]);
    
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // --- LOGIC ARRAY TICKET DINAMIS (Tidak ada perubahan) ---

    const handleTicketChange = (id: number, field: keyof TicketState, value: string | number) => {
        setTicketTypes(prevTickets => 
            prevTickets.map(ticket => 
                ticket.id === id ? { ...ticket, [field]: value } : ticket
            )
        );
    };

    const addTicketType = () => {
        setTicketTypes(prevTickets => [
            ...prevTickets,
            { id: ticketIdCounter++, ticketName: '', ticketPrice: '', quota: '' } // <-- Increment ID
        ]);
    };

    const removeTicketType = (id: number) => {
        setTicketTypes(prevTickets => prevTickets.filter(ticket => ticket.id !== id));
    };

    // --- LOGIC SUBMIT UTAMA ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        // 1. Validasi Input (Pastikan semua tiket terisi)
        const invalidTicket = ticketTypes.some(t => !t.ticketName || t.ticketPrice === '' || t.quota === '');
        if (invalidTicket) {
            setError('Semua field pada Jenis Tiket wajib diisi.');
            setIsLoading(false);
            return;
        }

        // 2. Format Data untuk Backend
        const formattedTickets = ticketTypes.map(t => ({
            ticketName: t.ticketName,
            ticketPrice: Number(t.ticketPrice),
            quota: Number(t.quota),
        }));

        const finalData: EventCreationBody = {
            ...eventData,
            ticketTypes: formattedTickets,
            startDate: new Date(eventData.startDate).toISOString(), 
            endDate: new Date(eventData.endDate).toISOString(),
        } as EventCreationBody;

        try {
            // 3. Panggil API POST /events
            await createEventApi(finalData);
            
            setSuccessMessage('Event berhasil dibuat! Anda akan dialihkan ke dashboard.');
            // 4. Reset Form
            setEventData({ name: '', description: '', category: '', location: '', startDate: '', endDate: '' });
            setTicketTypes([{ id: Date.now(), ticketName: 'Regular', ticketPrice: '', quota: '' }]);

            // 5. Redirect setelah sukses
            setTimeout(() => {
                router.push('/organizer/dashboard');
            }, 2000);

        } catch (error: any) {
            setError(error.message || 'Failed to create event. Please check your data.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- RENDERING ---
    return (
        <>
        <Header />
        <div className="flex justify-center min-h-screen py-10 bg-gray-50">
            <Card className="max-w-4xl w-full">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Create New Event</h1>

                {/* Feedback Messages */}
                {error && <Alert color="failure" icon={HiInformationCircle} className="mb-4">{error}</Alert>}
                {successMessage && <Alert color="success" className="mb-4">{successMessage}</Alert>}

                <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
                    
                    {/* --- BAGIAN 1: DETAIL EVENT UTAMA --- */}
                    <h2 className="text-xl font-semibold border-b pb-2 text-gray-700">Event Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nama Event */}
                        <div>
                            <Label htmlFor="name">Event Name</Label> {/* PERBAIKAN */}
                            <TextInput id="name" required placeholder="Enter event name" value={eventData.name} onChange={(e) => setEventData({ ...eventData, name: e.target.value })} disabled={isLoading} />
                        </div>
                        {/* Kategori */}
                        <div>
                            <Label htmlFor="category">Category</Label> {/* PERBAIKAN */}
                            <TextInput id="category" required placeholder="Music, Sports, Webinar" value={eventData.category} onChange={(e) => setEventData({ ...eventData, category: e.target.value })} disabled={isLoading} />
                        </div>
                        {/* Lokasi */}
                        <div className="md:col-span-2">
                            <Label htmlFor="location">Event Location</Label> {/* PERBAIKAN */}
                            <TextInput id="location" required placeholder="Enter your event location" value={eventData.location} onChange={(e) => setEventData({ ...eventData, location: e.target.value })} disabled={isLoading} />
                        </div>
                        {/* Tanggal Mulai */}
                        <div>
                            <Label htmlFor="start_date">Start Date</Label> {/* PERBAIKAN */}
                            <TextInput id="start_date" type="datetime-local" required onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })} disabled={isLoading} />
                        </div>
                        {/* Tanggal Berakhir */}
                        <div>
                            <Label htmlFor="end_date">End Date</Label> {/* PERBAIKAN */}
                            <TextInput id="end_date" type="datetime-local" required onChange={(e) => setEventData({ ...eventData, endDate: e.target.value })} disabled={isLoading} />
                        </div>
                        {/* Deskripsi */}
                        <div className="md:col-span-2">
                            <Label htmlFor="description">Event Description</Label> {/* PERBAIKAN */}
                            <Textarea id="description" placeholder="Explain your event..." rows={4} value={eventData.description} onChange={(e) => setEventData({ ...eventData, description: e.target.value })} disabled={isLoading} />
                        </div>
                    </div>

                    {/* --- BAGIAN 2: JENIS TIKET DAN HARGA --- */}
                    <h2 className="text-xl font-semibold border-b pb-2 text-gray-700 mt-4">Ticket Type & Quota</h2>

                    {ticketTypes.map((ticket, index) => (
                        <div key={ticket.id} className="grid grid-cols-1 md:grid-cols-7 gap-3 border p-4 rounded-lg bg-gray-50">
                            {/* Nama Tiket */}
                            <div className="md:col-span-3">
                                <Label htmlFor={`name-${ticket.id}`}>Ticket Type</Label> {/* PERBAIKAN */}
                                <TextInput id={`name-${ticket.id}`} required placeholder="VIP / Early Bird" value={ticket.ticketName} onChange={(e) => handleTicketChange(ticket.id, 'ticketName', e.target.value)} disabled={isLoading} />
                            </div>
                            {/* Harga */}
                            <div className="md:col-span-2">
                                <Label htmlFor={`price-${ticket.id}`}>Price (IDR)</Label> {/* PERBAIKAN */}
                                <TextInput id={`price-${ticket.id}`} type="number" required min={0} placeholder="150000" value={ticket.ticketPrice} onChange={(e) => handleTicketChange(ticket.id, 'ticketPrice', e.target.value)} disabled={isLoading} />
                            </div>
                            {/* Kuota */}
                            <div className="md:col-span-1">
                                <Label htmlFor={`quota-${ticket.id}`}>Quota</Label> {/* PERBAIKAN */}
                                <TextInput id={`quota-${ticket.id}`} type="number" required min={1} placeholder="100" value={ticket.quota} onChange={(e) => handleTicketChange(ticket.id, 'quota', e.target.value)} disabled={isLoading} />
                            </div>
                            
                            {/* Tombol Hapus */}
                            <div className="md:col-span-1 flex items-end justify-center">
                                {ticketTypes.length > 1 && (
                                    <Button color="failure" size="sm" onClick={() => removeTicketType(ticket.id)} disabled={isLoading}>
                                        <HiTrash className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Tombol Tambah Tiket */}
                    <Button color="light" size="sm" onClick={addTicketType} disabled={isLoading} className="mt-2 self-start">
                        <HiPlus className="mr-2 h-5 w-5" />
                        Add Ticket Type
                    </Button>

                    {/* --- TOMBOL SUBMIT FINAL --- */}
                    <Button type="submit" className="mt-4" disabled={isLoading}>
                        {isLoading ? 'Saving the Event...' : 'Create Event'}
                    </Button>

                </form>
            </Card>
        </div></>
    );
}