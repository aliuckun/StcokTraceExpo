import { TradeAction } from '../../types/stock';
import { getAllStocks, saveStocks } from './stock.base';

export const TradeService = {
    /**
     * Belirli bir hisseye yeni bir alım/satım işlemi ekler
     */
    addTrade: async (stockId: string, trade: TradeAction): Promise<void> => {
        const stocks = await getAllStocks();
        const stockIndex = stocks.findIndex((s) => s.id === stockId);

        if (stockIndex > -1) {
            stocks[stockIndex].history.push(trade);
            // Burada istersen hissenin ortalama maliyetini veya 
            // güncel miktarını hesaplayan bir fonksiyonu da tetikleyebilirsin
            await saveStocks(stocks);
        }
    },

    /**
     * İşlem geçmişinden bir kaydı siler
     */
    removeTrade: async (stockId: string, tradeId: string): Promise<void> => {
        const stocks = await getAllStocks();
        const stockIndex = stocks.findIndex((s) => s.id === stockId);

        if (stockIndex > -1) {
            stocks[stockIndex].history = stocks[stockIndex].history.filter(t => t.id !== tradeId);
            await saveStocks(stocks);
        }
    },

    // Mevcut TradeService objesinin içine ekleyin:
    closePosition: async (stockId: string, tradeId: string, sellPrice: number): Promise<void> => {
        const stocks = await getAllStocks();
        const stockIndex = stocks.findIndex((s) => s.id === stockId);

        if (stockIndex > -1) {
            const history = stocks[stockIndex].history;
            const tradeIndex = history.findIndex(t => t.id === tradeId);

            if (tradeIndex > -1) {
                const trade = history[tradeIndex];
                const profit = trade.direction === 'LONG'
                    ? sellPrice - trade.buyPrice
                    : trade.buyPrice - sellPrice;

                history[tradeIndex] = {
                    ...trade,
                    position: 'CLOSED',
                    sellPrice,
                    exitDate: new Date().toISOString(),
                    profitValue: profit
                };
                await saveStocks(stocks);
            }
        }
    }
};