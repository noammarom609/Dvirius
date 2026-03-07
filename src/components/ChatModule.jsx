import React, { useEffect, useRef } from 'react';

const ChatModule = ({
    messages,
    inputValue,
    setInputValue,
    handleSend,
    isModularMode,
    activeDragElement,
    position,
    width = 672, // default max-w-2xl
    height,
    onMouseDown
}) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div
            id="chat"
            onMouseDown={onMouseDown}
            className={`absolute px-6 py-4 pointer-events-auto transition-all duration-200 
            backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl rounded-2xl
            ${isModularMode ? (activeDragElement === 'chat' ? 'ring-2 ring-green-500' : 'ring-1 ring-yellow-500/30') : ''}
        `}
            style={{
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, 0)', // Aligned top-center
                width: width,
                height: height
            }}
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>

            <div
                className="flex flex-col gap-3 overflow-y-auto mb-4 scrollbar-hide mask-image-gradient relative z-10"
                style={{ height: height ? `calc(${height}px - 70px)` : '15rem' }}
            >
                {messages.slice(-5).map((msg, i) => {
                    const isAI = msg.sender !== 'User' && msg.sender !== 'System';
                    return (
                        <div key={i} className={`text-sm rounded-xl px-4 py-2.5 ${
                            msg.sender === 'System'
                                ? 'bg-white/5 border border-white/5 text-gray-500 text-xs'
                                : isAI
                                    ? 'bg-teal-500/5 border border-teal-500/10'
                                    : 'bg-violet-500/5 border border-violet-500/10'
                        }`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`font-medium text-xs ${
                                    msg.sender === 'System' ? 'text-gray-600' : isAI ? 'text-teal-400' : 'text-violet-400'
                                }`}>{msg.sender}</span>
                                <span className="text-gray-700 font-mono text-[10px]">{msg.time}</span>
                            </div>
                            <div className="text-gray-300 leading-relaxed">{msg.text}</div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2 relative z-10 absolute bottom-4 left-6 right-6">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleSend}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder-gray-600 text-sm"
                />
            </div>
            {isModularMode && <div className={`absolute -top-6 left-0 text-xs font-bold tracking-widest ${activeDragElement === 'chat' ? 'text-green-500' : 'text-yellow-500/50'}`}>CHAT MODULE</div>}
        </div>
    );
};

export default ChatModule;
