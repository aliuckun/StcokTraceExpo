import { TradeAction, TradePlan, SupportLevel } from '../../types/stock';
import { getAllStocks, saveStocks } from './stock.base';
import { generateId } from '../../utils/generateId';

export const TradeService = {
    calculateProfit: (trade: TradeAction): number => {
        if (!trade.sellPrice || trade.position !== 'CLOSED') return 0;
        const diff = trade.direction === 'LONG'
            ? trade.sellPrice - trade.buyPrice
            : trade.buyPrice - trade.sellPrice;
        return diff * trade.quantity;
    },

    addTrade: async (stockId: string, trade: TradeAction): Promise<void> => {
        const stocks = await getAllStocks();
        const stock = stocks.find(s => s.id === stockId);
        if (!stock) return;
        stock.history.push(trade);
        await saveStocks(stocks);
    },

    closePosition: async (stockId: string, tradeId: string, sellPrice: number): Promise<void> => {
        const stocks = await getAllStocks();
        const stock = stocks.find(s => s.id === stockId);
        if (!stock) return;
        const trade = stock.history.find(t => t.id === tradeId);
        if (trade && trade.position === 'OPEN') {
            trade.position = 'CLOSED';
            trade.sellPrice = sellPrice;
            trade.exitDate = new Date().toISOString();
            await saveStocks(stocks);
        }
    },

    removeTrade: async (stockId: string, tradeId: string): Promise<void> => {
        const stocks = await getAllStocks();
        const stock = stocks.find(s => s.id === stockId);
        if (!stock) return;
        stock.history = stock.history.filter(t => t.id !== tradeId);
        await saveStocks(stocks);
    },

    addPlan: async (stockId: string, plan: TradePlan): Promise<void> => {
        const stocks = await getAllStocks();
        const stock = stocks.find(s => s.id === stockId);
        if (!stock) return;
        stock.plans.push(plan);
        await saveStocks(stocks);
    },

    removePlan: async (stockId: string, planId: string): Promise<void> => {
        const stocks = await getAllStocks();
        const stock = stocks.find(s => s.id === stockId);
        if (!stock) return;
        stock.plans = stock.plans.filter(p => p.id !== planId);
        await saveStocks(stocks);
    },

    addSupport: async (stockId: string, support: SupportLevel): Promise<void> => {
        const stocks = await getAllStocks();
        const stock = stocks.find(s => s.id === stockId);
        if (!stock) return;
        stock.supports.push(support);
        await saveStocks(stocks);
    },

    removeSupport: async (stockId: string, supportId: string): Promise<void> => {
        const stocks = await getAllStocks();
        const stock = stocks.find(s => s.id === stockId);
        if (!stock) return;
        stock.supports = stock.supports.filter(s => s.id !== supportId);
        await saveStocks(stocks);
    },
};