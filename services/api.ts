import { ApiCredentials, OrderRequest, BinanceOrderResponse, OrderType } from '../types';
import { hmacSha256 } from '../utils/crypto';

const BASE_URL = 'https://testnet.binancefuture.com';

/**
 * Mocks the Binance API response for demonstration/development purposes
 * or when CORS prevents direct browser access.
 */
const mockPlaceOrder = async (order: OrderRequest): Promise<BinanceOrderResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate randomness for success/fail
      const success = true; 
      
      if (success) {
        resolve({
          orderId: Math.floor(Math.random() * 1000000000),
          symbol: order.symbol.toUpperCase(),
          status: 'NEW',
          clientOrderId: `web_${Date.now()}`,
          price: order.price || '0',
          avgPrice: '0.00000',
          origQty: order.quantity,
          executedQty: '0',
          cumQuote: '0',
          timeInForce: 'GTC',
          type: order.type,
          side: order.side,
          stopPrice: order.stopPrice || '0',
          workingType: 'CONTRACT_PRICE',
          priceProtect: false,
          origType: order.type,
          updateTime: Date.now()
        });
      } else {
        reject(new Error('Simulated network error or insufficient balance'));
      }
    }, 800); // Artificial delay
  });
};

/**
 * Mocks cancel order response
 */
const mockCancelOrder = async (symbol: string, orderId: string): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        resolve({
            symbol: symbol.toUpperCase(),
            orderId: /^\d+$/.test(orderId) ? parseInt(orderId) : Math.floor(Math.random() * 1000000000),
            clientOrderId: /^\d+$/.test(orderId) ? `web_${Date.now()}` : orderId,
            status: 'CANCELED',
            origQty: '0.100',
            executedQty: '0.000',
            cumQuote: '0.000',
            timeInForce: 'GTC',
            type: 'LIMIT',
            side: 'BUY',
            updateTime: Date.now()
        });
    }, 600);
  });
};

/**
 * Real API call to Binance Futures Testnet.
 * Note: Requires a CORS-enabled environment (extension or proxy).
 */
const realPlaceOrder = async (order: OrderRequest, creds: ApiCredentials): Promise<BinanceOrderResponse> => {
  if (!creds.apiKey || !creds.apiSecret) {
    throw new Error('API Credentials missing');
  }

  const endpoint = '/fapi/v1/order';
  const timestamp = Date.now();
  
  // Build Query String
  const params: Record<string, string> = {
    symbol: order.symbol.toUpperCase(),
    side: order.side,
    quantity: order.quantity,
    timestamp: timestamp.toString(),
    recvWindow: '5000'
  };

  // Map internal OrderType to Binance API Type
  if (order.type === OrderType.MARKET) {
    params.type = 'MARKET';
  } else if (order.type === OrderType.LIMIT) {
    params.type = 'LIMIT';
    if (!order.price) throw new Error('Price is required for LIMIT orders');
    params.price = order.price;
    params.timeInForce = 'GTC';
  } else if (order.type === OrderType.STOP_LIMIT) {
    params.type = 'STOP'; // Binance Futures uses 'STOP' for Stop Limit
    if (!order.price) throw new Error('Price is required for STOP_LIMIT orders');
    if (!order.stopPrice) throw new Error('Stop Price is required for STOP_LIMIT orders');
    params.price = order.price;
    params.stopPrice = order.stopPrice;
    params.timeInForce = 'GTC';
  }

  // Convert to query string sorted keys (optional but good practice)
  const queryString = Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Generate Signature
  const signature = await hmacSha256(creds.apiSecret, queryString);
  const fullQueryString = `${queryString}&signature=${signature}`;

  const response = await fetch(`${BASE_URL}${endpoint}?${fullQueryString}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MBX-APIKEY': creds.apiKey
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.msg || `API Error: ${response.status}`);
  }

  return data;
};

const realCancelOrder = async (symbol: string, orderId: string, creds: ApiCredentials): Promise<any> => {
  if (!creds.apiKey || !creds.apiSecret) {
    throw new Error('API Credentials missing');
  }

  const endpoint = '/fapi/v1/order';
  const timestamp = Date.now();

  const params: Record<string, string> = {
      symbol: symbol.toUpperCase(),
      timestamp: timestamp.toString(),
      recvWindow: '5000'
  };

  // Heuristic: If purely numeric, assume orderId. Otherwise assume origClientOrderId.
  if (/^\d+$/.test(orderId)) {
      params.orderId = orderId;
  } else {
      params.origClientOrderId = orderId;
  }

  const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');

  const signature = await hmacSha256(creds.apiSecret, queryString);
  const fullQueryString = `${queryString}&signature=${signature}`;

  const response = await fetch(`${BASE_URL}${endpoint}?${fullQueryString}`, {
      method: 'DELETE',
      headers: {
          'Content-Type': 'application/json',
          'X-MBX-APIKEY': creds.apiKey
      }
  });

  const data = await response.json();

  if (!response.ok) {
      throw new Error(data.msg || `API Error: ${response.status}`);
  }

  return data;
};

export const placeOrder = async (
  isDemo: boolean, 
  order: OrderRequest, 
  creds: ApiCredentials
): Promise<BinanceOrderResponse> => {
  if (isDemo) {
    return mockPlaceOrder(order);
  }
  return realPlaceOrder(order, creds);
};

export const cancelOrder = async (
  isDemo: boolean,
  symbol: string,
  orderId: string,
  creds: ApiCredentials
): Promise<any> => {
  if (isDemo) {
      return mockCancelOrder(symbol, orderId);
  }
  return realCancelOrder(symbol, orderId, creds);
};

export const getListenKey = async (apiKey: string): Promise<string> => {
  const response = await fetch(`${BASE_URL}/fapi/v1/listenKey`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MBX-APIKEY': apiKey
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg || `Failed to get listenKey: ${response.status}`);
  }

  return data.listenKey;
};

export const keepAliveListenKey = async (apiKey: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/fapi/v1/listenKey`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-MBX-APIKEY': apiKey
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg || `Failed to keep-alive listenKey: ${response.status}`);
  }
  return data;
};