import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, LayoutAnimation, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Stock } from '../types/stock';
import { StockService } from '../services/stock/stock.service';

// ana sayfanın buton kodları 
export const useStocks = () => {
    const [stocks, setStocks] = useState<Stock[]>([]);
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

    const addStock = async (symbol: string, name: string) => {
        const newStock: Stock = {
            id: Date.now().toString(),
            symbol: symbol.toUpperCase().trim(),
            name: name.trim(),
            history: [],
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
        stocks,
        deletingId,
        setDeletingId,
        animRefs,
        actions: { addStock, deleteStock, updatePrice }
    };
};