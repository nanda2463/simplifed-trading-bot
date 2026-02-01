import React, { useState, useCallback, useEffect } from 'react';
import OrderForm from './components/OrderForm';
import GridForm from './components/GridForm';
import CancelForm from './components/CancelForm';
import ConsoleLog from './components/ConsoleLog';
import { OrderRequest, LogEntry, ApiCredentials } from './types';
import { placeOrder, getListenKey, cancelOrder, keepAliveListenKey } from './services/api';
import { subscribeToTicker, subscribeToUserData } from './services/websocket';
import { Settings, Shield, Zap, Globe, AlertTriangle, Activity, Grid, Wifi, XCircle } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'grid' | 'cancel'>('manual');
  
  // Market Data State
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);

  // Logging Helper
  const addLog = useCallback((level: LogEntry['level'], message: string, details?: any) => {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  // WebSocket Effect for Ticker
  useEffect(() => {
    const handler = setTimeout(() => {
      if (symbol.length >= 3) {
        const cleanup = subscribeToTicker(symbol, (price) => {
          setCurrentPrice(price);
        });
        return cleanup;
      }
    }, 500); // Debounce to avoid spamming connection while typing

    return () => {
      clearTimeout(handler);
      subscribeToTicker('', () => {}); // Force close
    };
  }, [symbol]);

  // WebSocket Effect for User Data Stream
  useEffect(() => {
    let cleanupFn: (() => void) | undefined;
    let keepAliveInterval: any = null;

    const connectUserData = async () => {
      // Only connect if in Live Mode and API Key is available
      if (!demoMode && apiKey) {
        try {
          addLog('INFO', 'Initializing Real-time User Data Stream...');
          const listenKey = await getListenKey(apiKey);
          
          cleanupFn = subscribeToUserData(listenKey, (data) => {
            const statusColor = data.status === 'FILLED' ? 'SUCCESS' 
                              : data.status === 'CANCELED' ? 'WARN' 
                              : 'INFO';
            
            const msg = `Order Update: ${data.symbol} is ${data.status}`;
            
            addLog(statusColor, msg, {
              side: data.side,
              filled: `${data.executedQty} / ${data.originalQty}`,
              price: data.avgPrice,
              type: data.type
            });
          });
          
          addLog('SUCCESS', 'User Data Stream Connected');

          // Keep-alive every 50 minutes (listenKey invalidates after 60m)
          keepAliveInterval = setInterval(async () => {
             try {
                await keepAliveListenKey(apiKey);
                addLog('INFO', 'User Stream ListenKey extended');
             } catch (e) {
                addLog('WARN', 'Failed to extend ListenKey', e);
             }
          }, 50 * 60 * 1000);

        } catch (e: any) {
          addLog('ERROR', 'Failed to connect to User Stream. Check API Key/Network.', { error: e.message });
        }
      }
    };

    if (!demoMode && apiKey) {
      connectUserData();
    }

    return () => {
      if (cleanupFn) cleanupFn();
      if (keepAliveInterval) clearInterval(keepAliveInterval);
    };
  }, [demoMode, apiKey, addLog]);

  // Handler for Single Order
  const handleOrderSubmit = async (order: OrderRequest) => {
    setIsLoading(true);
    addLog('INFO', `Preparing to send ${order.side} ${order.type} order for ${order.symbol}...`, order);

    try {
      if (!demoMode && (!apiKey || !apiSecret)) {
        throw new Error('API Key and Secret required for Live Mode');
      }

      const creds: ApiCredentials = { apiKey, apiSecret };
      const response = await placeOrder(demoMode, order, creds);
      
      addLog('SUCCESS', `Order Placed Successfully: #${response.orderId}`, response);

      // Simulate an update for Demo Mode so user sees "movement"
      if (demoMode) {
        setTimeout(() => {
          addLog('SUCCESS', `(Simulated) Order Update: ${order.symbol} is FILLED`, {
            side: order.side,
            filled: `${order.quantity} / ${order.quantity}`,
            price: currentPrice || order.price || 'Market',
            status: 'FILLED'
          });
        }, 2000);
      }

    } catch (error: any) {
      addLog('ERROR', error.message || 'Failed to place order', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for Grid Strategy (Multiple Orders)
  const handleGridSubmit = async (orders: OrderRequest[]) => {
    setIsLoading(true);
    addLog('INFO', `Starting Grid Deployment: ${orders.length} orders generated`, { count: orders.length });

    if (!demoMode && (!apiKey || !apiSecret)) {
       addLog('ERROR', 'API Key and Secret required for Live Mode');
       setIsLoading(false);
       return;
    }

    const creds: ApiCredentials = { apiKey, apiSecret };
    let successCount = 0;
    let failCount = 0;

    // Execute sequentially to respect rate limits (basic implementation)
    for (const order of orders) {
      try {
        await placeOrder(demoMode, order, creds);
        addLog('SUCCESS', `Grid Order Placed: ${order.side} @ ${order.price}`, { symbol: order.symbol });
        successCount++;
        // Small delay
        await new Promise(r => setTimeout(r, 200)); 
      } catch (error: any) {
        addLog('ERROR', `Grid Order Failed: ${order.price}`, error);
        failCount++;
      }
    }

    addLog('INFO', `Grid Deployment Complete. Success: ${successCount}, Failed: ${failCount}`);
    setIsLoading(false);
  };

  // Handler for Cancel Order
  const handleCancelSubmit = async (targetSymbol: string, orderId: string) => {
    setIsLoading(true);
    addLog('INFO', `Attempting to cancel order ${orderId} for ${targetSymbol}...`);

    try {
        if (!demoMode && (!apiKey || !apiSecret)) {
            throw new Error('API Key and Secret required for Live Mode');
        }

        const creds: ApiCredentials = { apiKey, apiSecret };
        const response = await cancelOrder(demoMode, targetSymbol, orderId, creds);

        addLog('SUCCESS', `Order Canceled: ${response.orderId || orderId}`, response);
        
        // If simulated
        if (demoMode) {
             addLog('WARN', `(Simulated) Order Status Updated: CANCELED`);
        }

    } catch (error: any) {
        addLog('ERROR', error.message || 'Failed to cancel order', error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-lg shadow-lg shadow-orange-500/20">
              <Zap className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                Binance Terminal
              </h1>
              <p className="text-xs text-slate-500 font-mono tracking-tight">FUTURES TESTNET</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Mode Toggle */}
            <div className="flex items-center bg-slate-800 rounded-full p-1 border border-slate-700">
              <button
                onClick={() => setDemoMode(true)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  demoMode ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Demo
              </button>
              <button
                onClick={() => setDemoMode(false)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  !demoMode ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live
              </button>
            </div>

            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors border ${showSettings ? 'bg-slate-800 border-blue-500/50 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel (Collapsible) */}
      {showSettings && (
        <div className="bg-slate-900 border-b border-slate-800 animate-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto px-4 py-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-blue-400" />
                API Credentials (Required for Live Mode)
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <input
                  type="password"
                  placeholder="API Secret"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4 text-sm text-blue-200/80">
              <div className="flex items-start">
                <InfoIcon className="w-5 h-5 text-blue-400 mr-2 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p>
                    <strong>Security Note:</strong> Keys are stored only in React state memory. They are never sent to any server other than Binance.
                  </p>
                  <p>
                    <strong>CORS Warning:</strong> Live Mode requires a browser extension (like "Allow CORS") to function because Binance API does not typically allow direct browser requests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)] min-h-[600px]">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-4 space-y-6 flex flex-col">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden flex-1 max-h-[700px] overflow-y-auto">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              
              {/* Tab Switcher */}
              <div className="flex space-x-2 mb-6 bg-slate-800/50 p-1 rounded-lg relative z-10">
                <button 
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Manual</span>
                </button>
                <button 
                  onClick={() => setActiveTab('grid')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'grid' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Grid className="w-4 h-4" />
                  <span>Grid</span>
                </button>
                <button 
                  onClick={() => setActiveTab('cancel')}
                  className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'cancel' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:text-red-300'}`}
                  title="Cancel Orders"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              {activeTab === 'manual' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-white flex items-center">
                      New Order
                    </h2>
                    {currentPrice && (
                       <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 animate-in fade-in">
                          <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
                          <span className="text-sm font-mono font-bold text-green-400">{currentPrice}</span>
                       </div>
                    )}
                  </div>
                  <OrderForm 
                    symbol={symbol}
                    onSymbolChange={setSymbol}
                    currentPrice={currentPrice}
                    onSubmit={handleOrderSubmit} 
                    isLoading={isLoading} 
                  />
                </>
              )}

              {activeTab === 'grid' && (
                <>
                   <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-white flex items-center">
                      Deploy Grid
                    </h2>
                     {currentPrice && (
                       <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 animate-in fade-in">
                          <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
                          <span className="text-sm font-mono font-bold text-green-400">{currentPrice}</span>
                       </div>
                    )}
                  </div>
                  <GridForm 
                    symbol={symbol}
                    onSymbolChange={setSymbol}
                    currentPrice={currentPrice}
                    onSubmit={handleGridSubmit} 
                    isLoading={isLoading} 
                  />
                </>
              )}

              {activeTab === 'cancel' && (
                 <>
                   <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-white flex items-center">
                      Cancel Order
                    </h2>
                  </div>
                  <CancelForm
                    symbol={symbol}
                    onSymbolChange={setSymbol}
                    onSubmit={handleCancelSubmit}
                    isLoading={isLoading}
                  />
                </>
              )}
              
              {!demoMode && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-rose-400 bg-rose-500/5 py-2 rounded border border-rose-500/10">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Live Mode Active - Real Testnet Funds</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-center items-center text-center space-y-4">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center relative">
                <Globe className="w-6 h-6 text-slate-500" />
                {currentPrice && <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>}
              </div>
              <div>
                <h3 className="text-slate-300 font-medium">Connection Status</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {demoMode ? 'Simulated Environment' : 'Direct API Connection'}
                </p>
                 <div className="mt-2 text-xs font-mono text-slate-400">
                    {currentPrice ? `Linked: ${symbol}` : 'Waiting for Ticker...'}
                 </div>
              </div>
            </div>
          </div>

          {/* Right Column: Console/Logs */}
          <div className="lg:col-span-8 h-full">
            <ConsoleLog logs={logs} onClear={() => setLogs([])} />
          </div>
        </div>
      </main>
    </div>
  );
};

// Simple Icon wrapper to avoid repetitive imports
const InfoIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default App;