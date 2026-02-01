# ⚡ Binance Futures Terminal

A professional-grade, high-performance trading interface designed for the **Binance Futures Testnet (USDT-M)**. Built with React 19 and Vite 6, this terminal provides real-time market data, automated grid deployment, and cryptographic request signing for secure execution.



## 🚀 Key Features

* **Dual Mode Execution**: 
    * **Demo Mode**: Safely test UI and logic with simulated order filling.
    * **Live Mode**: Connect directly to the Binance Futures Testnet with real API credentials.
* **Advanced Order Management**:
    * **Manual Trading**: Support for Market and Limit orders.
    * **Grid Strategy**: Automated deployment of multiple sequential orders to capture price volatility.
    * **Quick Cancel**: Rapid order cancellation by Symbol and Order ID.
* **Real-time Synchronization**:
    * **Ticker Stream**: Live price updates via Binance WebSockets.
    * **User Data Stream**: Real-time order status tracking (FILLED, CANCELED) using `listenKey` management.
* **Developer Console**: A detailed, color-coded logging system to track API responses, WebSocket events, and error states.

## 🛠️ Tech Stack

* **Frontend**: React 19 (Strict Mode), TypeScript.
* **Build Tool**: Vite 6.
* **Styling**: Tailwind CSS & Lucide React icons.
* **Real-time**: WebSocket API & REST API Integration.

## 📦 Getting Started

### Prerequisites
* Node.js (v18.0.0 or higher).
* Binance Futures Testnet API Key & Secret.

### Installation
1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/your-username/simplified-trading-bot.git](https://github.com/your-username/simplified-trading-bot.git)
    cd simplified-trading-bot
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    Create a `.env.local` file in the root directory:
    ```env
    GEMINI_API_KEY= ENTER YOUR API
    
    ```
    *Note: API keys for Binance are entered directly in the UI and stored only in volatile React state for security.*

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## ⚠️ Important Considerations

### 1. CORS Policy
The Binance API does not natively support direct browser-based requests (CORS). To use **Live Mode**, you must use a browser extension like "Allow CORS: Access-Control-Allow-Origin" or run a local proxy server.

### 2. Security
* **Memory Storage**: API credentials are never written to `localStorage` or `cookies`. They exist only in the application's memory and are cleared upon page refresh.
* **Testnet Only**: This application is pre-configured for the Binance Futures **Testnet**. Do not use Mainnet keys unless you have manually modified the base URL.

### 3. Rate Limiting
The Grid Strategy executes orders sequentially with a 200ms delay to respect Binance's rate limits and prevent IP bans during heavy deployment.

## 📂 Project Structure

* `App.tsx`: The central hub managing WebSocket connections and order state.
* `services/`: Logic modules for REST API calls and WebSocket subscriptions.
* `components/`: Atomic UI forms for Manual, Grid, and Cancel actions.
* `types.ts`: Strict TypeScript interfaces for Binance API responses and order requests.

---

**Developed by a B.Tech CSE (AI/ML) Student at SRMIST.** 
