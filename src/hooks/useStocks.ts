import { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutAnimation } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Stock } from '../types/stock';
import { StockService } from '../services/stock/stock.service';
import { BorsajsService } from '../services/api/borsajs.service';
import { useStockAnimation } from './useStockAnimation';
import { generateId } from '../utils/generateId';
import { StorageHelper } from '../services/storage.helper';

export const useStocks = () => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [bist100, setBist100] = useState<{ last: number; changePercent: number } | null>(null);
    const isFocused = useIsFocused();
    const { animRefs, initAnim, playDeleteAnim } = useStockAnimation();

    const loadData = useCallback(async () => {
        const data = await StockService.getAll();
        setStocks(data);
        data.forEach(stock => initAnim(stock.id));

        // Önce kayıtlı veriyi göster
        const cached = await StorageHelper.getItem<{ last: number; changePercent: number }>('@bist100');
        if (cached) setBist100(cached);

        // Sonra API'den taze veri çek
        try {
            const bistData = await BorsajsService.getBist100();
            const bist = { last: bistData.last, changePercent: bistData.changePercent };
            setBist100(bist);
            await StorageHelper.setItem('@bist100', bist);
            setLastUpdated(new Date().toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
            }));
        } catch {
            // sessiz hata
        }
    }, []);

    useEffect(() => {
        if (isFocused) loadData();
    }, [isFocused, loadData]);

    const filteredStocks = useMemo(() => {
        let result = [...stocks];
        if (searchQuery.trim()) {
            const query = searchQuery.toUpperCase().trim();
            result = result.filter(s =>
                s.symbol.toUpperCase().includes(query) ||
                s.name.toUpperCase().includes(query)
            );
        }
        return result.sort((a, b) => {
            const aHasOpen = a.history.some(t => t.position === 'OPEN') ? 1 : 0;
            const bHasOpen = b.history.some(t => t.position === 'OPEN') ? 1 : 0;
            return bHasOpen - aHasOpen;
        });
    }, [stocks, searchQuery]);

    const refreshAllPrices = useCallback(async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            const data = await StockService.getAll();

            // BIST100 sadece bir kez çekiliyor
            try {
                const bistData = await BorsajsService.getBist100();
                setBist100({ last: bistData.last, changePercent: bistData.changePercent });
            } catch {
                // sessiz hata
            }

            // Her hisse için fiyat çekiliyor
            const now = new Date().toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const updated = await Promise.all(
                data.map(async stock => {
                    try {
                        const priceData = await BorsajsService.refreshPrice(stock.symbol);
                        return {
                            ...stock,
                            currentPrice: priceData.last,
                            changePercent: priceData.changePercent,
                            lastUpdated: now,
                        };
                    } catch {
                        return stock;
                    }
                })
            );

            await Promise.all(updated.map(s => StockService.upsert(s)));
            setStocks(updated);
            setLastUpdated(now);
        } finally {
            setRefreshing(false);
        }
    }, [refreshing]);

    const addStock = async (symbol: string, name: string): Promise<void> => {
        const newStock: Stock = {
            id: generateId(),
            symbol: symbol.toUpperCase().trim(),
            name: name.trim(),
            history: [],
            plans: [],
            supports: [],
        };
        await StockService.upsert(newStock);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        await loadData();
    };

    const deleteStock = async (id: string): Promise<void> => {
        setDeletingId(id);
        playDeleteAnim(id, async () => {
            await StockService.delete(id);
            setStocks(prev => prev.filter(s => s.id !== id));
            setDeletingId(null);
        });
    };

    return {
        stocks: filteredStocks,
        searchQuery,
        setSearchQuery,
        deletingId,
        setDeletingId,
        animRefs,
        refreshing,
        lastUpdated,
        bist100,
        actions: { addStock, deleteStock, refreshAllPrices }
    };
};