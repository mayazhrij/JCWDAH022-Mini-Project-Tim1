import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tickety - Event Ticketing Platform",
  description: "A platform for buying and selling event tickets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Navbar harus diletakkan di sini */}
        
        {/* Konten halaman utama */}
        <div > {/* Tambahkan padding agar tidak tertutup Navbar */}
            {children}
        </div>
        
        {/* Opsional: SWR Provider jika digunakan di Client Components */}
      </body>
    </html>
  );
}
