"use client";

// web/src/components/Layout/AppNavbar.tsx

import { 
    Navbar, 
    NavbarBrand,    // <-- WAJIB: Import NavbarBrand
    NavbarCollapse, // <-- WAJIB: Import NavbarCollapse
    NavbarLink,     // <-- WAJIB: Import NavbarLink
    NavbarToggle,   // <-- WAJIB: Import NavbarToggle
    Button, 
    Dropdown,
    DropdownItem,
    DropdownDivider, 
} from 'flowbite-react'; 
import { useAuthStatus } from '@/hooks/useAuthStatus'; // Sesuaikan path
import Link from 'next/link';

const AppNavbar = () => {
    const { isAuthenticated, role } = useAuthStatus();
    
    // Fungsi logout (menggunakan logic dari Hari 1)
    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
        // Redirect ke halaman utama
        window.location.href = '/'; 
    };

    return (
        <Navbar fluid rounded className="bg-white border-b">
            <NavbarBrand as={Link} href="/">
                <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
                    EventMPV
                </span>
            </NavbarBrand>
            <div className="flex md:order-2 gap-2">
                {isAuthenticated ? (
                    <Dropdown label={role === 'organizer' ? 'Organizer' : 'Customer'} inline>
                        {role === 'organizer' && (
                            <DropdownItem as={Link} href="/organizer/create">Buat Event Baru</DropdownItem>
                        )}
                        {role === 'customer' && (
                            <DropdownItem as={Link} href="/transactions/my">Tiket Saya</DropdownItem>
                        )}
                        <DropdownDivider />
                        <DropdownItem onClick={handleLogout}>Keluar (Logout)</DropdownItem>
                    </Dropdown>
                ) : (
                    <Link href="/auth/login" passHref>
                        <Button color="blue">Masuk / Daftar</Button>
                    </Link>
                )}
                <NavbarToggle />
            </div>
            <NavbarCollapse>
                <NavbarLink as={Link} href="/" active={true}>Home</NavbarLink>
                <NavbarLink as={Link} href="/events">Cari Event</NavbarLink>
                {/* Tambahan Menu Lain */}
            </NavbarCollapse>
        </Navbar>
    );
};

export default AppNavbar;