export type PositionStatus = 'OPEN' | 'CLOSED';
export type TradeDirection = 'LONG' | 'SHORT';

export interface SupportLevel {
    id: string;
    price: number;
}

export interface StockNote {
    id: string;
    content: string;
    createdAt: string;
}

export interface TradePlan {
    id: string;
    stockSymbol: string;
    direction: TradeDirection;
    buyPrice: number;
    stopLoss?: number;
    takeProfit?: number;
    note: string;
}

export interface TradeAction {
    id: string;
    stockSymbol: string;
    direction: TradeDirection;
    buyPrice: number;
    quantity: number;
    stopLoss?: number;
    takeProfit?: number;
    sellPrice?: number;
    position: PositionStatus;
    entryDate: string;
    exitDate?: string;
    note?: string;
}

export interface Stock {
    id: string;
    name: string;
    symbol: string;
    currentPrice?: number;
    changePercent?: number;
    lastUpdated?: string;
    history: TradeAction[];
    plans: TradePlan[];
    supports: SupportLevel[];
    notes: StockNote[];
    isFavorite?: boolean;
}