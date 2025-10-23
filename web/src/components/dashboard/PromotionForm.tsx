"use client";

import React, { useState } from 'react';
import { Card, Label, TextInput, Textarea, Button, Alert, Spinner } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi';
import { createPromotionApi } from '@/services/promotion.service'; 
import { PromotionCreationBody } from '@/types/event'; // <-- Mengimpor dari file types/event.ts
import { useRouter } from 'next/navigation';

export default function PromotionForm({ eventId }: { eventId: string }) {
    const [formData, setFormData] = useState<Omit<PromotionCreationBody, 'eventId'>>({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
    });
    
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        const finalData: PromotionCreationBody = {
            ...formData,
            eventId: eventId, // ID Event diambil dari prop
            // NOTE: Karena backend kita sudah fix untuk 'Promosi Waktu Murni', 
            // kita tidak perlu field code dan diskon di frontend.
        } as PromotionCreationBody; 

        try {
            await createPromotionApi(finalData);
            
            setSuccessMessage('Promosi berhasil dibuat! Event Anda sekarang memiliki tanggal promosi.');
            setFormData({ title: '', description: '', startDate: '', endDate: '' });

        } catch (e: any) {
            setError(e.message || 'Gagal membuat promosi. Silakan cek koneksi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    return (
        <Card className="mt-6">
            <h5 className="text-2xl font-bold border-b pb-2 text-gray-700">Buat Promosi (Waktu)</h5>
            <p className="text-sm text-gray-500 mb-4">Promosi ini akan menandai event Anda memiliki harga khusus selama periode waktu yang ditentukan.</p>
            
            {error && <Alert color="failure" icon={HiInformationCircle} className="mb-4">{error}</Alert>}
            {successMessage && <Alert color="success" className="mb-4">{successMessage}</Alert>}

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {/* Judul Promosi */}
                <div>
                    <Label htmlFor="title">Judul Promosi</Label>
                    <TextInput id="title" required placeholder="Early Bird Spesial" value={formData.title} onChange={handleChange} disabled={isLoading} />
                </div>
                
                {/* Tanggal Mulai */}
                <div>
                    <Label htmlFor="startDate">Tanggal Mulai Promosi</Label>
                    <TextInput id="startDate" type="datetime-local" required value={formData.startDate} onChange={handleChange} disabled={isLoading} />
                </div>
                
                {/* Tanggal Berakhir */}
                <div>
                    <Label htmlFor="endDate">Tanggal Berakhir Promosi</Label>
                    <TextInput id="endDate" type="datetime-local" required value={formData.endDate} onChange={handleChange} disabled={isLoading} />
                </div>
                
                {/* Deskripsi */}
                <div>
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea id="description" placeholder="Syarat dan Ketentuan..." rows={3} value={formData.description} onChange={handleChange} disabled={isLoading} />
                </div>

                {/* Tombol Submit */}
                <Button type="submit" disabled={isLoading} className="mt-2">
                    {isLoading ? 'Menyimpan Promosi...' : 'Simpan Promosi'}
                </Button>
            </form>
        </Card>
    );
}