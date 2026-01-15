import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Stock, TradeAction } from '../types/stock';
import { StockService } from '../services/stock/stock.service';
import { TradeService } from '../services/stock/trade.service';

// hisselerin gecmis islemlerini tutan detail sayfasının buton kodları
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

    const addTrade = async (tradeData: { direction: 'LONG' | 'SHORT', buyPrice: number, stopLoss?: number, takeProfit?: number }) => {
        if (!stock) return;

        const newTrade: TradeAction = {
            id: Date.now().toString(),
            stockSymbol: stock.symbol,
            direction: tradeData.direction,
            position: 'OPEN',
            entryDate: new Date().toISOString(),
            buyPrice: tradeData.buyPrice,
            stopLoss: tradeData.stopLoss,
            takeProfit: tradeData.takeProfit,
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
        actions: { addTrade, closePosition, deleteTrade, refresh: loadData }
    };
};