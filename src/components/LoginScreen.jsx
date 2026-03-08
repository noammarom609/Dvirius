import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import {
    loginWithEmail,
    signupWithEmail,
    getOAuthUrl,
} from '../utils/auth';

const LoginScreen = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;
            if (mode === 'login') {
                result = await loginWithEmail(email, password);
            } else {
                if (!displayName.trim()) {
                    setError('Please enter your name');
                    setLoading(false);
                    return;
                }
                result = await signupWithEmail(email, password, displayName.trim());
            }
            onLoginSuccess(result);
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (provider) => {
        try {
            setError('');
            setLoading(true);
            const url = await getOAuthUrl(provider);
            // Open in system browser — Electron will catch the deep link callback
            const { shell } = window.require('electron');
            shell.openExternal(url);
            setLoading(false);
        } catch (err) {
            setError(err.message || 'Failed to start OAuth');
            setLoading(false);
        }
    };

    const getPasswordStrength = (pw) => {
        if (!pw) return null;
        const hasLetters = /[a-zA-Z]/.test(pw);
        const hasNumbers = /[0-9]/.test(pw);
        const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
        if (pw.length >= 10 && hasLetters && hasNumbers && hasSpecial)
            return { label: 'Strong', color: '#2dd4bf', width: '100%' };
        if (pw.length >= 8 && hasLetters && hasNumbers)
            return { label: 'Good', color: '#22c55e', width: '75%' };
        if (pw.length >= 6)
            return { label: 'Fair', color: '#eab308', width: '50%' };
        return { label: 'Weak', color: '#ef4444', width: '25%' };
    };

    const passwordStrength = mode === 'signup' && password.length > 0 ? getPasswordStrength(password) : null;

    return (
        <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-950/40 via-black to-black pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-950/20 via-transparent to-transparent pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative w-full max-w-md mx-4"
            >
                <div className="relative bg-gray-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_0_80px_rgba(94,234,212,0.06)]">
                    {/* Logo / Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center shadow-[0_0_40px_rgba(94,234,212,0.15)]"
                        >
                            <span className="text-2xl font-bold text-white">D</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl font-semibold bg-gradient-to-r from-teal-300 to-violet-400 bg-clip-text text-transparent"
                        >
                            Dvirious
                        </motion.h1>
                        <p className="text-gray-500 text-sm mt-2">
                            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
                        </p>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={() => handleOAuth('google')}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <button
                            onClick={() => handleOAuth('github')}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            Continue with GitHub
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-gray-600 uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="wait">
                            {mode === 'signup' && (
                                <motion.div
                                    key="name"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Your name"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all text-sm"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all text-sm"
                                autoFocus
                            />
                        </div>

                        <div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    required
                                    minLength={6}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all text-sm"
                                />
                            </div>
                            {passwordStrength && (
                                <div className="mt-2 px-1">
                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }}
                                        />
                                    </div>
                                    <p className="text-xs mt-1" style={{ color: passwordStrength.color }}>
                                        {passwordStrength.label}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-red-400 text-sm text-center"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all duration-300 bg-gradient-to-r from-teal-500 to-violet-500 text-white hover:from-teal-400 hover:to-violet-400 hover:shadow-[0_0_30px_rgba(94,234,212,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle mode */}
                    <p className="text-center text-gray-500 text-sm mt-6">
                        {mode === 'login' ? (
                            <>
                                Don't have an account?{' '}
                                <button
                                    onClick={() => { setMode('signup'); setError(''); }}
                                    className="text-teal-400 hover:text-teal-300 transition-colors"
                                >
                                    Sign up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <button
                                    onClick={() => { setMode('login'); setError(''); }}
                                    className="text-teal-400 hover:text-teal-300 transition-colors"
                                >
                                    Sign in
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginScreen;
