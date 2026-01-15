import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Stock, TradeAction } from '../types/stock';
import { StockService } from '../services/stock/stock.service';
import { TradeService } from '../services/stock/trade.service';

export const useStockDetail = (stockId: string) => {
    const [stock, setStock] = useState<Stock | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        const data = await StockService.getById(stockId);
        setStock(data || null);
        setLoading(false);
    }, [stockId]);

    useEffect(() => { loadData(); }, [loadData]);

    const addTrade = async (tradeData: Omit<TradeAction, 'id' | 'stockSymbol' | 'entryDate' | 'position'>) => {
        if (!stock) return;

        const newTrade: TradeAction = {
            ...tradeData,
            id: Date.now().toString(),
            stockSymbol: stock.symbol,
            entryDate: new Date().toISOString(),
            position: 'OPEN',
        };

        await TradeService.addTrade(stockId, newTrade);
        await loadData();
    };

    const closePosition = async (tradeId: string, sellPrice: number) => {
        await TradeService.closePosition(stockId, tradeId, sellPrice);
        await loadData();
    };

    const deleteTrade = async (tradeId: string) => {
        await TradeService.removeTrade(stockId, tradeId);
        await loadData();
    };

    return {
        stock,
        loading,
        actions: {
            addTrade,
            closePosition,
            deleteTrade,
            refresh: loadData
        }
    };
};