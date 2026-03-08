import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, X } from 'lucide-react';

const { ipcRenderer } = window.require('electron');

const UpdateNotification = () => {
    const [updateStatus, setUpdateStatus] = useState(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const handler = (event, data) => {
            setUpdateStatus(data);
            setDismissed(false);
        };
        ipcRenderer.on('update-status', handler);
        return () => ipcRenderer.removeListener('update-status', handler);
    }, []);

    if (!updateStatus || dismissed) return null;

    const handleInstall = () => {
        ipcRenderer.send('install-update');
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-14 right-4 z-[9999] pointer-events-auto"
            >
                <div className="bg-gray-950/90 backdrop-blur-2xl border border-white/10 rounded-xl px-4 py-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-3 max-w-xs">
                    {updateStatus.status === 'downloading' && (
                        <>
                            <Download size={16} className="text-teal-400 animate-bounce" />
                            <div className="flex-1">
                                <p className="text-xs text-white font-medium">
                                    Downloading v{updateStatus.version}
                                </p>
                                <p className="text-[10px] text-gray-500">Update in progress...</p>
                            </div>
                        </>
                    )}

                    {updateStatus.status === 'progress' && (
                        <>
                            <Download size={16} className="text-teal-400" />
                            <div className="flex-1">
                                <p className="text-xs text-white font-medium">
                                    Downloading... {updateStatus.percent}%
                                </p>
                                <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                                    <div
                                        className="h-full bg-teal-500 rounded-full transition-all duration-300"
                                        style={{ width: `${updateStatus.percent}%` }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {updateStatus.status === 'ready' && (
                        <>
                            <RefreshCw size={16} className="text-green-400" />
                            <div className="flex-1">
                                <p className="text-xs text-white font-medium">
                                    v{updateStatus.version} ready
                                </p>
                                <button
                                    onClick={handleInstall}
                                    className="text-[10px] text-teal-400 hover:text-teal-300 transition-colors mt-0.5"
                                >
                                    Restart to update
                                </button>
                            </div>
                        </>
                    )}

                    <button
                        onClick={() => setDismissed(true)}
                        className="text-gray-600 hover:text-gray-400 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UpdateNotification;
