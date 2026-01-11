/**
 * Pozisyonun durumunu belirtir.
 */
export type PositionStatus = 'OPEN' | 'CLOSED';

/**
 * İşlemin yönünü belirtir.
 * LONG: Alış (Fiyat artışı beklenir)
 * SHORT: Açığa Satış (Fiyat düşüşü beklenir)
 */
export type TradeDirection = 'LONG' | 'SHORT';

/**
 * İşlem Detayları (Defter Kaydı)
 */
export interface TradeAction {
    id: string;
    stockSymbol: string;      // Hangi hisseye ait olduğu
    direction: TradeDirection; // LONG veya SHORT
    buyPrice: number;         // Giriş (Açılış) fiyatı
    stopLoss?: number;        // Zarar durdurma fiyatı
    takeProfit?: number;      // Hedef kâr fiyatı (Sell hedefi)
    sellPrice?: number;       // Çıkış (Kapanış) fiyatı
    position: PositionStatus;  // Açık mı, Kapalı mı?
    entryDate: Date | string;  // Pozisyona giriş tarihi
    exitDate?: Date | string;  // Pozisyondan çıkış tarihi
    profitValue?: number;     // Kar-Zarar tutarı (Manuel veya otomatik hesaplanabilir)
    note?: string;            // Neden bu işlemi yaptım? (Defter mantığı için ek bilgi)
}

/**
 * Ana Hisse Elemanı
 */
export interface Stock {
    id: string;
    name: string;             // Hisse ismi
    symbol: string;           // Kısaltması (THYAO, AAPL vb.)
    currentPrice?: number;    // Güncel değeri (Opsiyonel - Manuel takip için)
    history: TradeAction[];   // Bu hisseye ait geçmiş tüm pozisyonlar
}