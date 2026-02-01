import { OrderRequest, OrderType } from '../types';

interface SymbolRules {
  minQty: number;
  priceDecimals: number; // Number of decimal places allowed for price
  qtyDecimals: number;   // Number of decimal places allowed for quantity
}

// Hardcoded rules for common Binance Futures Testnet symbols
// In a production app, these should be fetched via /fapi/v1/exchangeInfo
const TRADING_RULES: Record<string, SymbolRules> = {
  'BTCUSDT': { minQty: 0.001, priceDecimals: 1, qtyDecimals: 3 },
  'ETHUSDT': { minQty: 0.01, priceDecimals: 2, qtyDecimals: 3 },
  'BNBUSDT': { minQty: 0.01, priceDecimals: 2, qtyDecimals: 2 },
  'SOLUSDT': { minQty: 1, priceDecimals: 3, qtyDecimals: 0 },
  'XRPUSDT': { minQty: 0.1, priceDecimals: 4, qtyDecimals: 1 },
  'ADAUSDT': { minQty: 1, priceDecimals: 4, qtyDecimals: 0 },
  'DOGEUSDT': { minQty: 1, priceDecimals: 5, qtyDecimals: 0 },
  // Default fallback
  'DEFAULT': { minQty: 0.001, priceDecimals: 2, qtyDecimals: 3 }
};

export const getSymbolRules = (symbol: string): SymbolRules => {
  return TRADING_RULES[symbol.toUpperCase()] || TRADING_RULES['DEFAULT'];
};

const countDecimals = (valueStr: string): number => {
  if (valueStr.indexOf('.') === -1) return 0;
  return valueStr.split('.')[1].length;
};

export const validateOrderInput = (order: OrderRequest): string | null => {
  const rules = getSymbolRules(order.symbol);
  
  // 1. Validate Quantity
  if (!order.quantity || isNaN(parseFloat(order.quantity))) {
    return 'Quantity is required and must be a number.';
  }
  const qty = parseFloat(order.quantity);
  
  if (qty < rules.minQty) {
    return `Quantity ${qty} is below the minimum allowed (${rules.minQty}) for ${order.symbol}.`;
  }

  if (countDecimals(order.quantity) > rules.qtyDecimals) {
    return `Quantity precision too high. Max decimals allowed: ${rules.qtyDecimals}.`;
  }

  // 2. Validate Price (Limit Orders)
  if (order.type === OrderType.LIMIT || order.type === OrderType.STOP_LIMIT) {
    if (!order.price || isNaN(parseFloat(order.price))) {
      return 'Price is required for Limit/Stop-Limit orders.';
    }
    const price = parseFloat(order.price);
    if (price <= 0) return 'Price must be greater than 0.';
    
    if (countDecimals(order.price) > rules.priceDecimals) {
      return `Price precision too high. Max decimals allowed: ${rules.priceDecimals}.`;
    }
  }

  // 3. Validate Stop Price (Stop Orders)
  if (order.type === OrderType.STOP_LIMIT) {
    if (!order.stopPrice || isNaN(parseFloat(order.stopPrice))) {
      return 'Stop Price is required for Stop-Limit orders.';
    }
    const stopPrice = parseFloat(order.stopPrice);
    if (stopPrice <= 0) return 'Stop Price must be greater than 0.';

    if (countDecimals(order.stopPrice) > rules.priceDecimals) {
      return `Stop Price precision too high. Max decimals allowed: ${rules.priceDecimals}.`;
    }
  }

  return null;
};

export const validateGridInput = (
  symbol: string,
  minPrice: string, 
  maxPrice: string, 
  quantity: string
): string | null => {
  const rules = getSymbolRules(symbol);
  
  // Prices
  if (!minPrice || !maxPrice) return "Min and Max prices are required.";
  const min = parseFloat(minPrice);
  const max = parseFloat(maxPrice);
  
  if (min >= max) return "Min Price must be lower than Max Price.";
  if (min <= 0) return "Min Price must be positive.";
  
  if (countDecimals(minPrice) > rules.priceDecimals) return `Min Price precision too high (Max ${rules.priceDecimals}).`;
  if (countDecimals(maxPrice) > rules.priceDecimals) return `Max Price precision too high (Max ${rules.priceDecimals}).`;

  // Quantity
  if (!quantity) return "Quantity per grid is required.";
  const qty = parseFloat(quantity);
  if (qty < rules.minQty) return `Grid quantity below minimum (${rules.minQty}).`;
  if (countDecimals(quantity) > rules.qtyDecimals) return `Quantity precision too high (Max ${rules.qtyDecimals}).`;

  return null;
};