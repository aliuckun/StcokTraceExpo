import { useState, useEffect, useCallback } from 'react';
import { Stock, TradeAction, TradePlan, SupportLevel, TradeDirection, StockNote } from '../types/stock';
import { StockService } from '../services/stock/stock.service';
import { TradeService } from '../services/stock/trade.service';
import { BorsajsService } from '../services/api/borsajs.service';
import { generateId } from '../utils/generateId';
export const useStockDetail = (stockId: string) => {
    const [stock, setStock] = useState<Stock | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        const data = await StockService.getById(stockId);
        setStock(data || null);
        setLoading(false);
    }, [stockId]);

    useEffect(() => { loadData(); }, [loadData]);

    const refreshPrice = async (): Promise<void> => {
        if (!stock || refreshing) return;
        setRefreshing(true);
        try {
            const priceData = await BorsajsService.refreshPrice(stock.symbol);
            const updated = {
                ...stock,
                currentPrice: priceData.last,
                changePercent: priceData.changePercent,
                lastUpdated: new Date().toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
            await StockService.upsert(updated);
            setStock(updated);
        } finally {
            setRefreshing(false);
        }
    };

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
            id: generateId(),
            stockSymbol: stock.symbol,
            direction: tradeData.direction,
            position: 'OPEN',
            entryDate: new Date().toISOString(),
            buyPrice: tradeData.buyPrice,
            quantity: tradeData.quantity,
            stopLoss: tradeData.stopLoss,
            takeProfit: tradeData.takeProfit,
            note: tradeData.note,
        };
        await TradeService.addTrade(stockId, newTrade);
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

    const addPlan = async (planData: {
        direction: TradeDirection;
        buyPrice: number;
        stopLoss?: number;
        takeProfit?: number;
        note: string;
    }): Promise<void> => {
        if (!stock) return;
        const newPlan: TradePlan = {
            id: generateId(),
            stockSymbol: stock.symbol,
            direction: planData.direction,
            buyPrice: planData.buyPrice,
            stopLoss: planData.stopLoss,
            takeProfit: planData.takeProfit,
            note: planData.note,
        };
        await TradeService.addPlan(stockId, newPlan);
        await loadData();
    };

    const deletePlan = async (planId: string): Promise<void> => {
        await TradeService.removePlan(stockId, planId);
        await loadData();
    };

    const addSupport = async (price: number): Promise<void> => {
        const newSupport: SupportLevel = {
            id: generateId(),
            price,
        };
        await TradeService.addSupport(stockId, newSupport);
        await loadData();
    };

    const removeSupport = async (supportId: string): Promise<void> => {
        await TradeService.removeSupport(stockId, supportId);
        await loadData();
    };

    const addNote = async (content: string): Promise<void> => {
        if (!stock) return;
        const newNote: StockNote = {
            id: generateId(),
            content: content.trim(),
            createdAt: new Date().toISOString(),
        };
        const updated: Stock = { ...stock, notes: [newNote, ...stock.notes] };
        await StockService.upsert(updated);
        setStock(updated);
    };

    const deleteNote = async (noteId: string): Promise<void> => {
        if (!stock) return;
        const updated: Stock = { ...stock, notes: stock.notes.filter(n => n.id !== noteId) };
        await StockService.upsert(updated);
        setStock(updated);
    };

    return {
        stock,
        loading,
        refreshing,
        actions: {
            refreshPrice,
            addTrade,
            closePosition,
            deleteTrade,
            addPlan,
            deletePlan,
            addSupport,
            removeSupport,
            addNote,
            deleteNote,
            refresh: loadData,
        }
    };
};