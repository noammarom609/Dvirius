import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const toast = {
        info: (msg) => addToast(msg, 'info'),
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        warn: (msg) => addToast(msg, 'warn'),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-xl shadow-lg pointer-events-auto animate-fade-in
                        ${t.type === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-300' : ''}
                        ${t.type === 'success' ? 'bg-teal-500/20 border border-teal-500/30 text-teal-300' : ''}
                        ${t.type === 'warn' ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300' : ''}
                        ${t.type === 'info' ? 'bg-white/10 border border-white/20 text-gray-200' : ''}
                    `}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
