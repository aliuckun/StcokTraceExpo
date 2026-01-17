import { Stock, TradeAction, TradePlan } from '../../types/stock';

// stock.base.ts'den import et
import { getAllStocks, saveStocks } from './stock.base';

export class TradeService {
    // Kar/Zarar Hesaplama
    static calculateProfit(trade: TradeAction): number {
        if (!trade.sellPrice || trade.position !== 'CLOSED') return 0;

        const diff = trade.direction === 'LONG'
            ? trade.sellPrice - trade.buyPrice
            : trade.buyPrice - trade.sellPrice;

        return diff * trade.quantity;
    }

    // GERÇEK İŞLEM İŞLEMLERİ
    static async addTrade(stockId: string, trade: TradeAction): Promise<void> {
        const stocks = await getAllStocks();
        const stockIndex = stocks.findIndex(s => s.id === stockId);

        if (stockIndex === -1) return;

        stocks[stockIndex].history.push(trade);
        await saveStocks(stocks);
    }

    static async closePosition(stockId: string, tradeId: string, sellPrice: number): Promise<void> {
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
    }

    static async removeTrade(stockId: string, tradeId: string): Promise<void> {
        const stocks = await getAllStocks();
        const stock = stocks.find(s => s.id === stockId);

        if (!stock) return;

        stock.history = stock.history.filter(t => t.id !== tradeId);
        await saveStocks(stocks);
    }

    // PLAN İŞLEMLERİ
    static async addPlan(stockId: string, plan: TradePlan): Promise<void> {
        const stocks = await getAllStocks();
        const stock = stocks.find(s => s.id === stockId);

        if (!stock) {
            console.error('Stock not found:', stockId);
            return;
        }

        // Plans dizisini başlat (yoksa)
        if (!stock.plans) {
            stock.plans = [];
        }

        stock.plans.push(plan);
        console.log('Plan added:', plan);
        console.log('Total plans for stock:', stock.plans.length);

        await saveStocks(stocks);
    }

    static async removePlan(stockId: string, planId: string): Promise<void> {
        const stocks = await getAllStocks();
        const stock = stocks.find(s => s.id === stockId);

        if (!stock || !stock.plans) return;

        stock.plans = stock.plans.filter(p => p.id !== planId);
        await saveStocks(stocks);
    }

    static async convertPlanToTrade(
        stockId: string,
        planId: string,
        quantity: number,
        actualBuyPrice?: number
    ): Promise<void> {
        const stocks = await getAllStocks();
        const stock = stocks.find(s => s.id === stockId);

        if (!stock || !stock.plans) return;

        const plan = stock.plans.find(p => p.id === planId);
        if (!plan) return;

        // Planı gerçek işleme çevir
        const newTrade: TradeAction = {
            id: Date.now().toString(),
            stockSymbol: plan.stockSymbol,
            direction: plan.direction,
            buyPrice: actualBuyPrice || plan.buyPrice,
            quantity: quantity,
            stopLoss: plan.stopLoss,
            takeProfit: plan.takeProfit,
            note: `Plan'dan dönüştürüldü: ${plan.note}`,
            position: 'OPEN',
            entryDate: new Date().toISOString()
        };

        stock.history.push(newTrade);

        // Planı sil
        stock.plans = stock.plans.filter(p => p.id !== planId);

        await saveStocks(stocks);
    }
}