"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function PartnerLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await apiClient.loginPartner(email, password);

            // Redirect based on partner type
            const partnerType = response.partnerType;
            if (partnerType === 'DSA') {
                router.push('/dsa-dashboard');
            } else if (partnerType === 'BC') {
                router.push('/bc-dashboard');
            } else if (partnerType === 'AFFILIATE') {
                router.push('/affiliate-dashboard');
            } else {
                router.push('/dsa-dashboard'); // Default fallback
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Login</h1>
                    <p className="text-gray-600">Access your partner dashboard</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="partner@example.com"
                                required
                                className="w-full"
                                disabled={loading}
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full"
                                disabled={loading}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-all"
                        >
                            {loading ? 'Logging in...' : 'Login to Dashboard'}
                        </Button>
                    </form>

                    {/* Links */}
                    <div className="mt-6 text-center space-y-2">
                        <p className="text-sm text-gray-600">
                            Forgot your password?{' '}
                            <Link href="/partners/reset-password" className="text-red-500 hover:text-red-600 font-medium">
                                Reset it here
                            </Link>
                        </p>
                        <p className="text-sm text-gray-600">
                            Not a partner yet?{' '}
                            <Link href="/affiliate-program" className="text-red-500 hover:text-red-600 font-medium">
                                Learn more
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
