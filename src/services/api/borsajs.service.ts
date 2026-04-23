import Constants from 'expo-constants';
import { withCache, clearCache, TTL } from './cache.service';

const BASE_URL = 'https://y-ali18.vercel.app';
const API_KEY = Constants.expoConfig?.extra?.apiKey as string;

const authHeader = { 'x-api-key': API_KEY };

const get = async (endpoint: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}${endpoint}`, { headers: authHeader });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
};

export const BorsajsService = {
    getPrice: async (symbol: string) => {
        return withCache(`price_${symbol}`, () =>
            get(`/api/ticker?symbol=${symbol}`)
            , TTL.PRICE);
    },

    getNews: async (symbol: string) => {
        return withCache(`news_${symbol}`, () =>
            get(`/api/news?symbol=${symbol}`)
            , TTL.NEWS);
    },

    getScreener: async (template = 'high_dividend') => {
        return withCache(`screener_${template}`, () =>
            get(`/api/screener?template=${template}`)
            , TTL.SCREENER);
    },

    getCalendar: async () => {
        return withCache('calendar', () =>
            get('/api/calendar')
            , TTL.CALENDAR);
    },

    getBist100: async () => {
        return withCache('bist100', () =>
            get('/api/ticker?symbol=XU100')
            , TTL.PRICE);
    },

    refreshPrice: async (symbol: string) => {
        clearCache(`price_${symbol}`);
        return BorsajsService.getPrice(symbol);
    },
};
