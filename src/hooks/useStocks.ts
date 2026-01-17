import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Animated, LayoutAnimation } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Stock } from '../types/stock';
import { StockService } from '../services/stock/stock.service';

export const useStocks = () => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [searchQuery, setSearchQuery] = useState(''); // Arama state'i
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const isFocused = useIsFocused();
    const animRefs = useRef<{ [key: string]: Animated.Value }>({});

    const loadData = useCallback(async () => {
        const data = await StockService.getAll();
        setStocks(data);
        data.forEach(stock => {
            if (!animRefs.current[stock.id]) {
                animRefs.current[stock.id] = new Animated.Value(1);
            }
        });
    }, []);

    useEffect(() => {
        if (isFocused) loadData();
    }, [isFocused, loadData]);

    // FİLTRELEME VE SIRALAMA MANTIĞI
    const filteredStocks = useMemo(() => {
        let result = [...stocks];

        // 1. Arama Filtresi
        if (searchQuery.trim()) {
            const query = searchQuery.toUpperCase().trim();
            result = result.filter(s =>
                s.symbol.toUpperCase().includes(query) ||
                s.name.toUpperCase().includes(query)
            );
        }

        // 2. Akıllı Sıralama (Açık işlemi olanlar en üste)
        return result.sort((a, b) => {
            const aHasOpen = a.history.some(t => t.position === 'OPEN') ? 1 : 0;
            const bHasOpen = b.history.some(t => t.position === 'OPEN') ? 1 : 0;
            return bHasOpen - aHasOpen; // 1 olanlar (açık işlem) üste çıkar
        });
    }, [stocks, searchQuery]);

    const addStock = async (symbol: string, name: string) => {
        const newStock: Stock = {
            id: Date.now().toString(),
            symbol: symbol.toUpperCase().trim(),
            name: name.trim(),
            history: [],
            plans: [], // Hatanın çözümü: Yeni eklediğimiz zorunlu alan
        };
        await StockService.upsert(newStock);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        await loadData();
    };

    const deleteStock = async (id: string) => {
        const anim = animRefs.current[id];
        if (anim) {
            Animated.timing(anim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(async () => {
                await StockService.delete(id);
                setStocks(prev => prev.filter(s => s.id !== id));
                setDeletingId(null);
                delete animRefs.current[id];
            });
        }
    };

    const updatePrice = async (stock: Stock, price: number) => {
        await StockService.upsert({ ...stock, currentPrice: price });
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        await loadData();
    };

    return {
        stocks: filteredStocks, // Artık dışarıya filtrelenmiş listeyi veriyoruz
        searchQuery,
        setSearchQuery,
        deletingId,
        setDeletingId,
        animRefs,
        actions: { addStock, deleteStock, updatePrice }
    };
};