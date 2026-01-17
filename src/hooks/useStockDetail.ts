import { useState, useEffect, useCallback } from 'react';
import { Stock, TradeAction, TradePlan, TradeDirection } from '../types/stock';
import { StockService } from '../services/stock/stock.service';
import { TradeService } from '../services/stock/trade.service';

// Hook'un döndürdüğü actions tipini tanımlayalım
interface StockDetailActions {
    addTrade: (tradeData: {
        direction: TradeDirection;
        buyPrice: number;
        quantity: number;
        stopLoss?: number;
        takeProfit?: number;
        note?: string;
    }) => Promise<void>;
    addPlan: (planData: {
        direction: TradeDirection;
        buyPrice: number;
        stopLoss?: number;
        takeProfit?: number;
        note: string;
    }) => Promise<void>;
    convertPlanToTrade: (planId: string, quantity: number, actualBuyPrice?: number) => Promise<void>;
    closePosition: (tradeId: string, sellPrice: number) => Promise<void>;
    deleteTrade: (tradeId: string) => Promise<void>;
    deletePlan: (planId: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export const useStockDetail = (stockId: string): {
    stock: Stock | null;
    loading: boolean;
    actions: StockDetailActions;
} => {
    const [stock, setStock] = useState<Stock | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        const data = await StockService.getById(stockId);
        setStock(data || null);
        setLoading(false);
    }, [stockId]);

    useEffect(() => { loadData(); }, [loadData]);

    // GERÇEK İŞLEM EKLE
    const addTrade = async (tradeData: {
        direction: TradeDirection;
        buyPrice: number;
        quantity: number;
        stopLoss?: number;
        takeProfit?: number;
        note?: string;
    }): Promise<void> => {
        if (!stock) return;

        const newTrade: TradeAction = {
            id: Date.now().toString(),
            stockSymbol: stock.symbol,
            direction: tradeData.direction,
            position: 'OPEN',
            entryDate: new Date().toISOString(),
            buyPrice: tradeData.buyPrice,
            quantity: tradeData.quantity,
            stopLoss: tradeData.stopLoss,
            takeProfit: tradeData.takeProfit,
            note: tradeData.note
        };

        await TradeService.addTrade(stockId, newTrade);
        await loadData();
    };

    // PLANLI İŞLEM EKLE
    const addPlan = async (planData: {
        direction: TradeDirection;
        buyPrice: number;
        stopLoss?: number;
        takeProfit?: number;
        note: string;
    }): Promise<void> => {
        if (!stock) return;

        const newPlan: TradePlan = {
            id: Date.now().toString(),
            stockSymbol: stock.symbol,
            direction: planData.direction,
            buyPrice: planData.buyPrice,
            stopLoss: planData.stopLoss,
            takeProfit: planData.takeProfit,
            note: planData.note
        };

        await TradeService.addPlan(stockId, newPlan);
        await loadData();
    };

    // PLANI GERÇEK İŞLEME ÇEVİR
    const convertPlanToTrade = async (planId: string, quantity: number, actualBuyPrice?: number): Promise<void> => {
        await TradeService.convertPlanToTrade(stockId, planId, quantity, actualBuyPrice);
        await loadData();
    };

    const closePosition = async (tradeId: string, sellPrice: number): Promise<void> => {
        await TradeService.closePosition(stockId, tradeId, sellPrice);
        await loadData();
    };

    const deleteTrade = async (tradeId: string): Promise<void> => {
        await TradeService.removeTrade(stockId, tradeId);
        await loadData();
    };

    const deletePlan = async (planId: string): Promise<void> => {
        await TradeService.removePlan(stockId, planId);
        await loadData();
    };

    return {
        stock,
        loading,
        actions: {
            addTrade,
            addPlan,
            convertPlanToTrade,
            closePosition,
            deleteTrade,
            deletePlan,
            refresh: loadData
        }
    };
};