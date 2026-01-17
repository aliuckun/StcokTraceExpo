export type PositionStatus = 'OPEN' | 'CLOSED';
export type TradeDirection = 'LONG' | 'SHORT';

/**
 * TradePlan: İleride yapılması planlanan işlemler.
 * "Strateji Defteri" mantığıyla çalışır.
 */
export interface TradePlan {
    id: string;
    stockSymbol: string;
    direction: TradeDirection;
    buyPrice: number;          // Hedef giriş fiyatı
    stopLoss?: number;
    takeProfit?: number;
    note: string;              // Plan aşamasında zorunlu: Neden bu işleme giriyorum?
}

/**
 * TradeAction: Gerçekleşen işlem detayları.
 * Mevcut yapını bozmamak için değişken isimleri korundu.
 */
export interface TradeAction {
    id: string;
    stockSymbol: string;
    direction: TradeDirection;
    buyPrice: number;          // Giriş fiyatı
    quantity: number;          // Miktar (Yeni eklendi)
    stopLoss?: number;
    takeProfit?: number;
    sellPrice?: number;
    position: PositionStatus;
    entryDate: Date | string;
    exitDate?: Date | string;
    note?: string;             // İşlem sırasında opsiyonel
}

export interface Stock {
    id: string;
    name: string;
    symbol: string;
    currentPrice?: number;
    history: TradeAction[];    // Gerçekleşenler
    plans: TradePlan[];       // Hedefler (Yeni eklendi)
}