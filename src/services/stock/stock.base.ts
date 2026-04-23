import { StorageHelper } from '../storage.helper';
import { Stock } from '../../types/stock';

export const STORAGE_KEY = '@stock_tracker_data';

const normalizeStock = (stock: Stock): Stock => ({
    ...stock,
    plans: stock.plans ?? [],
    supports: stock.supports ?? [],
    history: stock.history ?? [],
});

export const getAllStocks = async (): Promise<Stock[]> => {
    const stocks = await StorageHelper.getItem<Stock[]>(STORAGE_KEY);
    return (stocks ?? []).map(normalizeStock);
};

export const saveStocks = async (stocks: Stock[]): Promise<void> => {
    await StorageHelper.setItem(STORAGE_KEY, stocks);
};