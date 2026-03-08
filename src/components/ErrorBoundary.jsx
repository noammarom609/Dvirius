import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
                    <div className="text-teal-400 text-lg font-bold mb-2">Something went wrong</div>
                    <p className="text-gray-400 text-sm mb-4">{this.state.error?.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-teal-500/20 border border-teal-500/30 rounded-lg text-teal-400 hover:bg-teal-500/30 text-sm"
                    >
                        Reload App
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
