"use client";

import { 
    Navbar, 
    NavbarBrand,    
    NavbarCollapse, 
    NavbarLink, 
    NavbarToggle, 
    Button, 
    Dropdown,
    DropdownItem,
    DropdownDivider, 
} from 'flowbite-react'; 
import { useAuthStatus } from '@/hooks/useAuthStatus'; 
import Link from 'next/link';
import { HiTicket } from 'react-icons/hi';

const AppNavbar = () => {
    
    // Fungsi logout
    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
        window.location.href = '/'; 
    };

    return (
        // Gunakan tag Navbar yang benar
        <Navbar fluid rounded className="bg-purple-600 fixed w-full z-30 shadow-md">
            
            {/* --- BRANDING (Kiri) --- */}
            <NavbarBrand as={Link} href="/" className="text-white">
                <div className="flex items-center space-x-2">
                    <HiTicket className="w-8 h-8" /> 
                    <span className="text-2xl font-bold">
                        Tickety
                    </span> 
                </div>
            </NavbarBrand>
            </Navbar>
            
            )};

export default AppNavbar;