"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Label, TextInput, Button, Alert } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi';
import { login } from '@/services/auth.service';
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
      const user = await login({ email, password });
      
      if (user.role === 'organizer') {
        router.push('/organizer/dashboard');
      } else {
        router.push('/');
      }

    } catch (error) {
        let errorMessage: string;
if (typeof error === 'string') {
        errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        errorMessage = error.message; 
    } else {
        errorMessage = 'Terjadi kesalahan tidak terduga saat login.';
    }

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
              <Label htmlFor="email">Your Email</Label>
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
          
          <Button type="submit" disabled={isLoading}>
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