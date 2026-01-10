import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stock, TradeAction } from '../types/stock';

const STORAGE_KEY = '@stock_tracker_data';

/**
 * Tüm hisse verilerini getirir.
 */
export const getStocks = async (): Promise<Stock[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error("Veriler okunurken hata oluştu:", e);
        return [];
    }
};

/**
 * Tüm listeyi hafızaya kaydeder (Üzerine yazar).
 */
export const saveAllStocks = async (stocks: Stock[]): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(stocks);
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
        console.error("Veriler kaydedilirken hata oluştu:", e);
    }
};

/**
 * Yeni bir hisse ekler veya mevcut hisseyi günceller.
 */
export const upsertStock = async (stock: Stock): Promise<void> => {
    const stocks = await getStocks();
    const index = stocks.findIndex((s) => s.id === stock.id);

    if (index > -1) {
        stocks[index] = stock; // Güncelle
    } else {
        stocks.push(stock); // Yeni ekle
    }
    await saveAllStocks(stocks);
};

/**
 * Belirli bir hisseye yeni bir işlem (TradeAction) ekler.
 */
export const addTradeToStock = async (stockId: string, trade: TradeAction): Promise<void> => {
    const stocks = await getStocks();
    const stockIndex = stocks.findIndex((s) => s.id === stockId);

    if (stockIndex > -1) {
        stocks[stockIndex].history.push(trade);
        await saveAllStocks(stocks);
    }
};

/**
 * Belirli bir hisseyi siler.
 */
export const deleteStock = async (id: string): Promise<void> => {
    try {
        const stocks = await getStocks();
        const filteredStocks = stocks.filter(s => s.id !== id);
        await saveAllStocks(filteredStocks);
    } catch (e) {
        console.error("Hisse silinirken hata oluştu:", e);
    }
};

/**
 * Veritabanını tamamen temizler (Geliştirme aşamasında test için).
 */
export const clearAllData = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error("Veriler silinemedi:", e);
    }
};