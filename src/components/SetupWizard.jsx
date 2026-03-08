import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SetupWizard = ({ socket, onComplete }) => {
    const [userName, setUserName] = useState('');
    const [aiName, setAiName] = useState('Dvirious');
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!userName.trim()) {
            setError('Please enter your name');
            return;
        }
        if (!apiKey.trim()) {
            setError('Please enter your Gemini API key');
            return;
        }

        setIsSubmitting(true);
        setError('');

        socket.emit('complete_setup', {
            user_name: userName.trim(),
            ai_name: aiName.trim() || 'Dvirious',
            api_key: apiKey.trim()
        });

        // Listen for confirmation
        const handleSettings = (settings) => {
            if (settings.setup_complete) {
                socket.off('settings', handleSettings);
                socket.off('error', handleError);
                onComplete(settings);
            }
        };
        const handleError = (data) => {
            setError(data.msg);
            setIsSubmitting(false);
        };

        socket.on('settings', handleSettings);
        socket.on('error', handleError);
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-950/40 via-black to-black pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-950/20 via-transparent to-transparent pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative w-full max-w-md mx-4"
            >
                {/* Card */}
                <div className="relative bg-gray-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_0_80px_rgba(94,234,212,0.06)]">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl font-semibold bg-gradient-to-r from-teal-300 to-violet-400 bg-clip-text text-transparent"
                        >
                            Welcome
                        </motion.h1>
                        <p className="text-gray-500 text-sm mt-2">
                            Let's set up your AI assistant
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-5">
                        {/* User Name */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all"
                                autoFocus
                            />
                        </div>

                        {/* AI Name */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                                AI Assistant Name
                            </label>
                            <input
                                type="text"
                                value={aiName}
                                onChange={(e) => setAiName(e.target.value)}
                                placeholder="Dvirious"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all"
                            />
                        </div>

                        {/* API Key */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                                Gemini API Key
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIza..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all font-mono text-sm"
                            />
                            <p className="text-[11px] text-gray-600 mt-1.5">
                                Get your key from Google AI Studio
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full py-3 rounded-xl font-medium text-sm transition-all duration-300 bg-gradient-to-r from-teal-500 to-violet-500 text-white hover:from-teal-400 hover:to-violet-400 hover:shadow-[0_0_30px_rgba(94,234,212,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Setting up...' : 'Get Started'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SetupWizard;
