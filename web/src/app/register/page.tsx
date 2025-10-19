"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Label,
  TextInput,
  Button,
  Alert,
  Checkbox,
} from "flowbite-react";
import { HiInformationCircle } from "react-icons/hi";
import { register } from "@/services/auth.service"; // Sesuaikan path import
import Link from "next/link";
import {Toaster, toast} from "sonner";
import Header from "@/components/Headers";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "organizer">("customer"); // custom default role
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await register({ email, password, role, referralCode: referralCode || undefined });
      toast.success('Registrasi berhasil! Selamat datang di Tickety.');
      router.push('/');
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : 'Terjadi kesalahan.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (

    <>
    <Header />
    <Toaster position="top-right" />
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="max-w-md w-full">
        <h1 className=" text-2xl font-bold text-center mb-6">
          Register new account
        </h1>

        {error && (
          <Alert color="failure" icon={HiInformationCircle} className="mb-4">
            <span className="font-medium">{error}</span>
          </Alert>
        )}

        <form className="flex max-w-md flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="email2">Your email</Label>
            </div>
            <TextInput
              id="email2"
              type="email"
              placeholder="Your Email"
              required
              shadow
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="password2">Your password</Label>
            </div>
            <TextInput 
            id="password2" 
            type="password" 
            required 
            shadow 
            placeholder="Your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            
            />
          </div>

          <div>
            <Label htmlFor="refferalCode"> Refferal Code (optional)</Label>
            <TextInput
            id="referralCode"
            type="text"
            placeholder="if any"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            disabled={isLoading}
            />  
          </div>

          <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'customer' | 'organizer')}
                disabled={isLoading}
                className="block w-full p-2 border rounded"
              >
                <option value="customer">customer</option>
                <option value="organizer">organizer</option>
              </select>
            </div>
          
          <div className="flex items-center gap-2">
            <Checkbox id="agree" />
            <Label htmlFor="agree" className="flex">
              I agree with the&nbsp;
              <Link
                href="#"
                className="text-cyan-600 hover:underline dark:text-cyan-500"
              >
                terms and conditions
              </Link>
            </Label>
          </div>
          <Button type="submit">Register new account</Button>
        </form>
      </Card>
    </div>
    </>
  );
}
