import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './style/output.css';

function ForgotPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(token ? 'reset' : 'email'); // 'email' or 'reset'

    // Step 1: Request password reset
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email) {
            setError('Email is required');
            return;
        }

        try {
            setIsLoading(true);
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setMessage('Password reset instructions have been sent to your email');
            setEmail('');
            // Note: In production, user should click link in email
            // For testing, if backend returns token, we can move to reset step
            if (res.data?.resetToken) {
                setTimeout(() => setStep('reset'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process request');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Reset password with token
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!token && !email) {
            setError('Missing reset token or email');
            return;
        }

        if (!newPassword || !confirmPassword) {
            setError('Both password fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setIsLoading(true);
            const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
                token: token || email, // Use token from URL or email field
                newPassword,
                confirmPassword
            });
            setMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-950 text-white font-sans antialiased flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Reset Password
                    </h1>
                    <p className="mt-2 text-slate-400">Recover access to your account</p>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-8">
                    {step === 'email' ? (
                        <form onSubmit={handleForgotPassword} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder="your@email.com"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            {message && (
                                <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-300 text-sm">
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg font-semibold text-white transition disabled:opacity-50"
                            >
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </button>

                            <p className="text-center text-slate-400 text-sm">
                                Remember your password?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="text-blue-400 hover:text-blue-300 font-medium transition"
                                >
                                    Login
                                </button>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder="Confirm password"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            {message && (
                                <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-300 text-sm">
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg font-semibold text-white transition disabled:opacity-50"
                            >
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </button>

                            <p className="text-center text-slate-400 text-sm">
                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setEmail(''); setNewPassword(''); setConfirmPassword(''); setError(''); setMessage(''); }}
                                    className="text-blue-400 hover:text-blue-300 font-medium transition"
                                >
                                    Back to Email
                                </button>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
