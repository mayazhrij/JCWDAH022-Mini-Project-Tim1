"use client";

import { useAuthStatus } from '@/hooks/useAuthStatus'; 
import { useRouter } from 'next/navigation';
import { Spinner } from 'flowbite-react';
import React, { useEffect } from 'react'; 
import TransactionFlow from '@/components/TransactionFlow'; 

export default function MyTransactionsPage() {
    const { isAuthenticated, isInitialLoadComplete } = useAuthStatus();
    const router = useRouter();
    
    useEffect(() => {
        if (isInitialLoadComplete && !isAuthenticated) {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_role');
            
            router.push('/login');
        }
    }, [isAuthenticated, isInitialLoadComplete, router]);

    if (!isInitialLoadComplete) { 
        return <div className="text-center p-20 min-h-screen"><Spinner size="xl" /><p>Verifying Session...</p></div>;
    }
    if (!isAuthenticated) { 
        return null; 
    }
    
    return <TransactionFlow />;
}





