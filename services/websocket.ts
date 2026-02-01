/**
 * Manages WebSocket connection to Binance Futures Testnet for real-time price updates.
 */

type PriceCallback = (price: string) => void;

const RECONNECT_DELAY = 3000;

export const subscribeToTicker = (symbol: string, callback: PriceCallback) => {
  let ws: WebSocket | null = null;
  let active = true;
  let reconnectTimeout: any = null;

  if (!symbol) return () => {};

  const connect = () => {
    if (!active) return;

    // Using bookTicker for best bid/ask to calculate mid-price
    // Binance stream names are lowercase
    const streamName = `${symbol.toLowerCase()}@bookTicker`;
    const endpoint = `wss://stream.binancefuture.com/ws/${streamName}`;
    
    try {
      ws = new WebSocket(endpoint);

      ws.onopen = () => {
        // console.log(`Connected to ticker stream for ${symbol}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // data.b = best bid price, data.a = best ask price
          if (data.e === 'bookTicker' && data.b && data.a) {
            const bid = parseFloat(data.b);
            const ask = parseFloat(data.a);
            // Calculate mid-price
            const mid = (bid + ask) / 2;
            // Format based on magnitude (simple heuristic)
            const formatted = mid < 10 ? mid.toFixed(4) : mid.toFixed(2);
            callback(formatted);
          }
        } catch (err) {
          console.error('Error parsing ticker data', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
      };

      ws.onclose = () => {
        if (active) {
            console.log(`Ticker stream closed. Reconnecting in ${RECONNECT_DELAY}ms...`);
            reconnectTimeout = setTimeout(connect, RECONNECT_DELAY);
        }
      };

    } catch (e) {
      console.error('Failed to connect to WebSocket', e);
      if (active) {
        reconnectTimeout = setTimeout(connect, RECONNECT_DELAY);
      }
    }
  };

  connect();

  // Return cleanup function
  return () => {
    active = false;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (ws) {
      ws.close();
      ws = null;
    }
  };
};

export interface OrderUpdate {
  symbol: string;
  clientOrderId: string;
  side: string;
  type: string;
  status: string;
  originalQty: string;
  executedQty: string;
  avgPrice: string;
}

export const subscribeToUserData = (listenKey: string, onOrderUpdate: (data: OrderUpdate) => void) => {
  let userWs: WebSocket | null = null;
  let active = true;
  let reconnectTimeout: any = null;

  const connect = () => {
      if (!active) return;
      
      const endpoint = `wss://stream.binancefuture.com/ws/${listenKey}`;
      try {
        userWs = new WebSocket(endpoint);

        userWs.onopen = () => {
            console.log('Connected to User Data Stream');
        };

        userWs.onmessage = (event) => {
            try {
            const msg = JSON.parse(event.data);
            // Event Type: ORDER_TRADE_UPDATE
            if (msg.e === 'ORDER_TRADE_UPDATE') {
                const o = msg.o;
                onOrderUpdate({
                symbol: o.s,
                clientOrderId: o.c,
                side: o.S,
                type: o.o,
                status: o.X,
                originalQty: o.q,
                executedQty: o.z,
                avgPrice: o.ap
                });
            }
            } catch (err) {
            console.error('Error parsing user data stream', err);
            }
        };

        userWs.onerror = (err) => {
            console.warn('User Data Stream Error', err);
        };

        userWs.onclose = () => {
            if (active) {
                console.warn(`User Data Stream closed. Reconnecting in ${RECONNECT_DELAY}ms...`);
                reconnectTimeout = setTimeout(connect, RECONNECT_DELAY);
            }
        };
      } catch (e) {
          console.error("Failed to connect User Data Stream", e);
          if(active) {
              reconnectTimeout = setTimeout(connect, RECONNECT_DELAY);
          }
      }
  };

  connect();

  return () => {
    active = false;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (userWs) {
      userWs.close();
      userWs = null;
    }
  };
};