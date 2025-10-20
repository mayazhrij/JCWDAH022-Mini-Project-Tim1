"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Label, TextInput, Button, Alert } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi'; // Contoh ikon dari heroicons
import { login } from '@/services/auth.service'; // Sesuaikan path import
import Header from '@/components/Headers';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 
    setIsLoading(true);

    try {
      // 1. Panggil API Login
      const user = await login({ email, password });
      
      // 2. Jika berhasil, redirect sesuai role (Conditional Redirect)
      if (user.role === 'organizer') {
        router.push('/organizer/dashboard'); // Redirect Organizer
      } else {
        router.push('/'); // Redirect Customer ke homepage
      }

    } catch (error) {
        let errorMessage: string;
if (typeof error === 'string') {
        // Jika service Anda melempar string (seperti yang kita desain)
        errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        // Untuk error standar (misalnya TypeError atau sejenisnya)
        errorMessage = error.message; 
    } else {
        // Default jika tipe error tidak terduga
        errorMessage = 'Terjadi kesalahan tidak terduga saat login.';
    }

    // 2. Berikan string yang aman ke setError
    setError(errorMessage);
    
} finally {
    setIsLoading(false);
  }};

  return (
    <>
    <Header />
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Log in to your account</h1>

        {/* Tampilan Error */}
        {error && (
          <Alert color="failure" icon={HiInformationCircle} className="mb-4">
            <span className="font-medium">{error}</span>
          </Alert>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="email">Your Email</Label> {/* Teks diletakkan di sini */}
            </div>
            <TextInput
              id="email"
              type="email"
              placeholder="name@event.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="password">Your Password</Label>
            </div>
            <TextInput
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {/* Tombol Submit (Sudah Diperbaiki) */}
          <Button type="submit" disabled={isLoading}>
            {/* Logic children tetap ada untuk menampilkan status loading */}
            {isLoading ? 'Loading...' : 'Log In'}
          </Button>

          {/* Link Register */}
          <p className="text-sm text-center text-gray-500">
            Don't have an account?{' '}
            <a href="/register" className="text-cyan-600 hover:underline">
              Register here
            </a>
          </p>
        </form>
      </Card>
    </div>
    </>
  );
}