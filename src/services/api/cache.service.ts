const cache = new Map<string, { data: any; timestamp: number }>();

export const TTL = {
    PRICE: 300_000,
    NEWS: 300_000,
    CALENDAR: 3_600_000,
    SCREENER: 300_000,
};

export const withCache = async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = TTL.PRICE
): Promise<T> => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data as T;
    }
    const data = await fetcher();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
};

export const clearCache = (key?: string) => {
    if (key) {
        cache.delete(key);
    } else {
        cache.clear();
    }
};