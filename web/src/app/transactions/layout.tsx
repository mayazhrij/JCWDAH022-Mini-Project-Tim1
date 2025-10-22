import React from 'react';

// Layout ini hanya merender anak-anaknya (page.tsx)
export default function TransactionsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

