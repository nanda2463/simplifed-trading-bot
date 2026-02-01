import React, { useState } from 'react';
import { XCircle, Search } from 'lucide-react';

interface CancelFormProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  onSubmit: (symbol: string, orderId: string) => Promise<void>;
  isLoading: boolean;
}

const CancelForm: React.FC<CancelFormProps> = ({
    symbol,
    onSymbolChange,
    onSubmit,
    isLoading
}) => {
    const [orderId, setOrderId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!symbol || !orderId) return;
        onSubmit(symbol, orderId);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Symbol
                </label>
                <div className="relative">
                     <input
                        type="text"
                        value={symbol}
                        onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
                        className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                        placeholder="BTCUSDT"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Order ID / Client ID
                </label>
                <div className="relative">
                    <div className="absolute left-3 top-2.5 text-slate-500">
                        <Search className="w-4 h-4" />
                    </div>
                     <input
                        type="text"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                        placeholder="e.g. 12345678 or web_123..."
                        required
                    />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Enter the Order ID or Original Client Order ID to cancel.</p>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-md shadow-sm text-sm font-medium text-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                 {isLoading ? (
                    <span>Processing...</span>
                 ) : (
                    <>
                        <span>Cancel Order</span>
                        <XCircle className="w-4 h-4" />
                    </>
                 )}
            </button>
        </form>
    );
};

export default CancelForm;