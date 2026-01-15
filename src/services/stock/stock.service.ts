import { Stock } from '../../types/stock';
import { getAllStocks, saveStocks } from './stock.base';

export const StockService = {
    getAll: getAllStocks,

    upsert: async (stock: Stock): Promise<void> => {
        const stocks = await getAllStocks();
        const index = stocks.findIndex((s) => s.id === stock.id);

        if (index > -1) {
            stocks[index] = stock;
        } else {
            stocks.push(stock);
        }
        await saveStocks(stocks);
    },

    delete: async (id: string): Promise<void> => {
        const stocks = await getAllStocks();
        await saveStocks(stocks.filter(s => s.id !== id));
    },

    getById: async (id: string): Promise<Stock | undefined> => {
        const stocks = await getAllStocks();
        const stock = stocks.find(s => s.id === id);
        if (stock) {
            // Tarihe göre sıralama mantığını buraya taşıdık
            stock.history.sort((a, b) =>
                new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
            );
        }
        return stock;
    }
};