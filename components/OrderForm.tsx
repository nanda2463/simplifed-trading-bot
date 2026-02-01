import React, { useState, useEffect } from 'react';
import { OrderSide, OrderType, OrderRequest } from '../types';
import { validateOrderInput, getSymbolRules } from '../utils/validator';
import { ArrowRight, DollarSign, Activity, AlertCircle, RefreshCw, Info } from 'lucide-react';

interface OrderFormProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  currentPrice: string | null;
  onSubmit: (order: OrderRequest) => Promise<void>;
  isLoading: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({ 
  symbol, 
  onSymbolChange, 
  currentPrice, 
  onSubmit, 
  isLoading 
}) => {
  const [side, setSide] = useState<OrderSide>(OrderSide.BUY);
  const [type, setType] = useState<OrderType>(OrderType.LIMIT);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset validation when inputs change
  useEffect(() => {
    setValidationError(null);
  }, [symbol, side, type, quantity, price, stopPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const order: OrderRequest = {
      symbol,
      side,
      type,
      quantity,
      price: type !== OrderType.MARKET ? price : undefined,
      stopPrice: type === OrderType.STOP_LIMIT ? stopPrice : undefined
    };

    const error = validateOrderInput(order);
    if (error) {
      setValidationError(error);
      return;
    }

    onSubmit(order);
  };

  const fillPrice = () => {
    if (currentPrice) setPrice(currentPrice);
  };

  const rules = getSymbolRules(symbol);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Symbol Input */}
      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
          Symbol
        </label>
        <div className="relative">
          <input
            type="text"
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
            className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="BTCUSDT"
            required
          />
          <div className="absolute right-3 top-2.5 text-slate-500 text-xs font-bold">
            PERP
          </div>
        </div>
        
        {/* Trading Rules Display */}
        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-500">
          <div className="bg-slate-800/50 p-1.5 rounded border border-slate-700/50 flex flex-col items-center">
            <span className="uppercase tracking-wide opacity-70">Min Qty</span>
            <span className="text-slate-300 font-mono font-medium">{rules.minQty}</span>
          </div>
          <div className="bg-slate-800/50 p-1.5 rounded border border-slate-700/50 flex flex-col items-center">
            <span className="uppercase tracking-wide opacity-70">Price Prec</span>
            <span className="text-slate-300 font-mono font-medium">{rules.priceDecimals}</span>
          </div>
          <div className="bg-slate-800/50 p-1.5 rounded border border-slate-700/50 flex flex-col items-center">
            <span className="uppercase tracking-wide opacity-70">Qty Prec</span>
            <span className="text-slate-300 font-mono font-medium">{rules.qtyDecimals}</span>
          </div>
        </div>
      </div>

      {/* Side Selection */}
      <div className="grid grid-cols-2 gap-3 p-1 bg-slate-800 rounded-lg">
        <button
          type="button"
          onClick={() => setSide(OrderSide.BUY)}
          className={`flex items-center justify-center py-2 rounded-md text-sm font-bold transition-all duration-200 ${
            side === OrderSide.BUY
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          }`}
        >
          Buy / Long
        </button>
        <button
          type="button"
          onClick={() => setSide(OrderSide.SELL)}
          className={`flex items-center justify-center py-2 rounded-md text-sm font-bold transition-all duration-200 ${
            side === OrderSide.SELL
              ? 'bg-rose-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          }`}
        >
          Sell / Short
        </button>
      </div>

      {/* Order Type */}
      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
          Order Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-800 p-2 rounded border border-slate-700 hover:bg-slate-700 transition">
            <input
              type="radio"
              checked={type === OrderType.LIMIT}
              onChange={() => setType(OrderType.LIMIT)}
              className="form-radio text-blue-500 focus:ring-blue-500 h-4 w-4 border-gray-600 bg-slate-700"
            />
            <span className={`text-xs ${type === OrderType.LIMIT ? "text-white font-bold" : "text-slate-400"}`}>Limit</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-800 p-2 rounded border border-slate-700 hover:bg-slate-700 transition">
            <input
              type="radio"
              checked={type === OrderType.MARKET}
              onChange={() => setType(OrderType.MARKET)}
              className="form-radio text-blue-500 focus:ring-blue-500 h-4 w-4 border-gray-600 bg-slate-700"
            />
            <span className={`text-xs ${type === OrderType.MARKET ? "text-white font-bold" : "text-slate-400"}`}>Market</span>
          </label>
           <label className="flex items-center space-x-2 cursor-pointer bg-slate-800 p-2 rounded border border-slate-700 hover:bg-slate-700 transition">
            <input
              type="radio"
              checked={type === OrderType.STOP_LIMIT}
              onChange={() => setType(OrderType.STOP_LIMIT)}
              className="form-radio text-blue-500 focus:ring-blue-500 h-4 w-4 border-gray-600 bg-slate-700"
            />
            <span className={`text-xs ${type === OrderType.STOP_LIMIT ? "text-white font-bold" : "text-slate-400"}`}>Stop Limit</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Stop Price Input - Only for Stop Limit */}
        {type === OrderType.STOP_LIMIT && (
           <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Trigger Price (Stop)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-slate-500">
                <AlertCircle className="w-4 h-4" />
              </div>
              <input
                type="number"
                step={Math.pow(0.1, rules.priceDecimals).toString()}
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                required={type === OrderType.STOP_LIMIT}
                className="w-full bg-slate-800 border border-slate-600 text-white font-mono rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Trigger Price"
              />
            </div>
          </div>
        )}

        {/* Price Input - Conditional */}
        <div className={type === OrderType.MARKET ? 'opacity-50 pointer-events-none' : ''}>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
              {type === OrderType.STOP_LIMIT ? 'Limit Price' : 'Price (USDT)'}
            </label>
            {type !== OrderType.MARKET && currentPrice && (
              <button 
                type="button" 
                onClick={fillPrice}
                className="text-[10px] bg-slate-700 hover:bg-slate-600 text-blue-300 px-1.5 py-0.5 rounded transition"
              >
                Last: {currentPrice}
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute left-3 top-2.5 text-slate-500">
              <DollarSign className="w-4 h-4" />
            </div>
            <input
              type="number"
              step={Math.pow(0.1, rules.priceDecimals).toString()}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={type === OrderType.MARKET}
              required={type !== OrderType.MARKET}
              className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Quantity Input */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Size (Qty)
          </label>
          <div className="relative">
            <div className="absolute left-3 top-2.5 text-slate-500">
              <Activity className="w-4 h-4" />
            </div>
            <input
              type="number"
              step={Math.pow(0.1, rules.qtyDecimals).toString()}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Min ${rules.minQty}`}
            />
          </div>
        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-start space-x-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-300">{validationError}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-all duration-200
          ${isLoading 
            ? 'bg-slate-700 cursor-not-allowed' 
            : side === OrderSide.BUY 
              ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' 
              : 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900`}
      >
        {isLoading ? (
          <span>Processing...</span>
        ) : (
          <>
            <span>Place {type === OrderType.STOP_LIMIT ? 'Stop Limit' : type} {side}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};

export default OrderForm;