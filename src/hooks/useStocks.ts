import { useState, useCallback, useMemo } from 'react';
import { LayoutAnimation, InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Stock } from '../types/stock';
import { StockService } from '../services/stock/stock.service';
import { BorsajsService } from '../services/api/borsajs.service';
import { useStockAnimation } from './useStockAnimation';
import { generateId } from '../utils/generateId';
import { StorageHelper } from '../services/storage.helper';
import { getAllStocks, saveStocks } from '../services/stock/stock.base';

export const useStocks = () => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [bist100, setBist100] = useState<{ last: number; changePercent: number } | null>(null);
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

    useFocusEffect(
        useCallback(() => {
            const task = InteractionManager.runAfterInteractions(() => {
                loadData();
            });
            return () => task.cancel();
        }, [loadData])
    );

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
            const aFav = a.isFavorite ? 2 : 0;
            const bFav = b.isFavorite ? 2 : 0;
            const aHasOpen = a.history.some(t => t.position === 'OPEN') ? 1 : 0;
            const bHasOpen = b.history.some(t => t.position === 'OPEN') ? 1 : 0;
            return (bFav + bHasOpen) - (aFav + aHasOpen);
        });
    }, [stocks, searchQuery]);

    const refreshAllPrices = useCallback(async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            const data = await getAllStocks();

            // BIST100 sadece bir kez cekiliyor
            try {
                const bistData = await BorsajsService.getBist100();
                const bistInfo = { last: bistData.last, changePercent: bistData.changePercent };
                setBist100(bistInfo);
                await StorageHelper.setItem('@bist100', bistInfo);
            } catch {
                // sessiz hata
            }

            const now = new Date().toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Guncel hisse verilerini takip eden Map — race condition olmadan
            const updatedMap = new Map<string, Stock>(data.map(s => [s.id, s]));

            // UI'i mevcut verilerle baslat
            setStocks([...data]);

            // Her hisse icin ayri fetch baslat — geldikce aninda UI'a yansit (streaming)
            await Promise.all(
                data.map(async (stock) => {
                    try {
                        const priceData = await BorsajsService.refreshPrice(stock.symbol);
                        const updatedStock: Stock = {
                            ...stock,
                            currentPrice: priceData.last,
                            changePercent: priceData.changePercent,
                            lastUpdated: now,
                        };

                        // Map'i guncelle
                        updatedMap.set(stock.id, updatedStock);

                        // Hisse geldigi anda aninda UI'a yansit
                        setStocks(prev =>
                            prev.map(s => s.id === stock.id ? updatedStock : s)
                        );
                        setLastUpdated(now);
                    } catch {
                        // Hata durumunda eski veri korunur
                    }
                })
            );

            // Tum hisseler tamamlandiktan sonra tek seferlik kayit (race condition yok)
            const finalStocks = [...updatedMap.values()];
            await saveStocks(finalStocks);

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

    const toggleFavorite = async (id: string): Promise<void> => {
        const stock = stocks.find(s => s.id === id);
        if (!stock) return;
        const updated = { ...stock, isFavorite: !stock.isFavorite };
        await StockService.upsert(updated);
        setStocks(prev => prev.map(s => s.id === id ? updated : s));
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
        actions: { addStock, deleteStock, refreshAllPrices, toggleFavorite }
    };
};