import React, { useState, useEffect } from 'react';
import { OrderSide, OrderType, OrderRequest } from '../types';
import { validateGridInput, getSymbolRules } from '../utils/validator';
import { Grid, ArrowDown, TrendingUp, TrendingDown, Play, Target, AlertCircle } from 'lucide-react';

interface GridFormProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  currentPrice: string | null;
  onSubmit: (orders: OrderRequest[]) => Promise<void>;
  isLoading: boolean;
}

const GridForm: React.FC<GridFormProps> = ({ 
  symbol, 
  onSymbolChange, 
  currentPrice,
  onSubmit, 
  isLoading 
}) => {
  const [minPrice, setMinPrice] = useState('90000');
  const [maxPrice, setMaxPrice] = useState('100000');
  const [gridCount, setGridCount] = useState('5');
  const [quantityPerGrid, setQuantityPerGrid] = useState('0.001');
  const [refPrice, setRefPrice] = useState('95000');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setValidationError(null);
  }, [minPrice, maxPrice, quantityPerGrid, symbol]);

  const generateGrid = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validate Inputs
    const error = validateGridInput(symbol, minPrice, maxPrice, quantityPerGrid);
    if (error) {
      setValidationError(error);
      return;
    }

    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    const count = parseInt(gridCount);
    const ref = parseFloat(refPrice);
    const qty = quantityPerGrid;
    
    if (count < 2) {
      setValidationError("Grid count must be at least 2");
      return;
    }

    const rules = getSymbolRules(symbol);
    const step = (max - min) / (count - 1);
    const orders: OrderRequest[] = [];

    for (let i = 0; i < count; i++) {
      const priceLevel = min + (i * step);
      // Ensure price level respects precision
      const priceStr = priceLevel.toFixed(rules.priceDecimals);
      
      if (Math.abs(priceLevel - ref) < (1 / Math.pow(10, rules.priceDecimals))) continue; 
      
      const side = priceLevel < ref ? OrderSide.BUY : OrderSide.SELL;
      
      orders.push({
        symbol: symbol,
        side: side,
        type: OrderType.LIMIT,
        quantity: qty,
        price: priceStr,
        timeInForce: 'GTC'
      });
    }
    
    onSubmit(orders);
  };

  const useCurrentPrice = () => {
    if (currentPrice) setRefPrice(currentPrice);
  };

  const rules = getSymbolRules(symbol);

  return (
    <form onSubmit={generateGrid} className="space-y-6">
       <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
          Symbol
        </label>
        <div className="relative">
          <input
            type="text"
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
            className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Min Price
          </label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Max Price
          </label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider text-purple-300">
                Reference Price
            </label>
            {currentPrice && (
                <button 
                type="button" 
                onClick={useCurrentPrice}
                className="flex items-center space-x-1 text-[10px] bg-purple-900/50 hover:bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded transition border border-purple-500/20"
                >
                <Target className="w-3 h-3" />
                <span>Use Current: {currentPrice}</span>
                </button>
            )}
        </div>
        <div className="relative">
          <input
             type="number"
             value={refPrice}
             onChange={(e) => setRefPrice(e.target.value)}
             className="w-full bg-slate-900 border border-purple-500/50 text-white font-mono rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
             required
          />
          <span className="absolute right-3 top-2.5 text-xs text-slate-500">
             Buy Below / Sell Above
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Grid Levels
          </label>
          <input
            type="number"
            value={gridCount}
            onChange={(e) => setGridCount(e.target.value)}
            min="2"
            max="20"
            className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Qty Per Grid
          </label>
          <input
            type="number"
            step={Math.pow(0.1, rules.qtyDecimals).toString()}
            value={quantityPerGrid}
            onChange={(e) => setQuantityPerGrid(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder={`Min ${rules.minQty}`}
            required
          />
        </div>
      </div>

      <div className="bg-slate-800/50 p-3 rounded text-xs text-slate-400 flex flex-col space-y-2">
         <div className="flex items-center space-x-2">
            <TrendingDown className="w-3 h-3 text-emerald-400" />
            <span>Buys placed below {refPrice}</span>
         </div>
         <div className="flex items-center space-x-2">
            <TrendingUp className="w-3 h-3 text-rose-400" />
            <span>Sells placed above {refPrice}</span>
         </div>
      </div>

       {/* Validation Error Message */}
       {validationError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-start space-x-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-300">{validationError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Deploying...' : (
          <>
            <span>Deploy Strategy</span>
            <Grid className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};

export default GridForm;