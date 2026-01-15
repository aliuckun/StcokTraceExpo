import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageHelper = {
    async getItem<T>(key: string): Promise<T | null> {
        try {
            const value = await AsyncStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`${key} okunurken hata oluştu:`, error);
            return null;
        }
    },

    async setItem<T>(key: string, value: T): Promise<void> {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`${key} kaydedilirken hata oluştu:`, error);
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error(`${key} silinirken hata oluştu:`, error);
        }
    }
};