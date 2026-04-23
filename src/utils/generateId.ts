/**
 * Benzersiz bir ID üretir.
 * Tüm entity oluşturma işlemlerinde bu fonksiyon kullanılmalıdır.
 */
export const generateId = (): string => Date.now().toString();
