import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stock } from '../types/stock';

interface Props {
    stock: Stock;
    onPress: () => void;
}

export const StockCard: React.FC<Props> = ({ stock, onPress }) => {
    const hasOpenPosition = stock.history.some(t => t.position === 'OPEN');

    const change = stock.currentPrice && stock.currentPrice > 0
        ? ((stock.currentPrice - stock.currentPrice) / stock.currentPrice * 100)
        : null;

    return (
        <TouchableOpacity
            style={[s.card, hasOpenPosition && s.cardActive]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={s.left}>
                <Text style={s.symbol}>{stock.symbol}</Text>
                <Text style={s.name}>{stock.name}</Text>
                {hasOpenPosition && (
                    <View style={s.badge}>
                        <Text style={s.badgeText}>Açık pozisyon</Text>
                    </View>
                )}
            </View>

            <View style={s.right}>
                <Text style={s.price}>
                    {stock.currentPrice ? `${stock.currentPrice.toLocaleString('tr-TR')} ₺` : '---'}
                </Text>
                {stock.lastUpdated && (
                    <Text style={s.time}>{stock.lastUpdated}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const s = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardActive: {
        borderWidth: 1.5,
        borderColor: '#378add',
    },
    left: {
        gap: 3,
    },
    symbol: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1e293b',
    },
    name: {
        fontSize: 10,
        color: '#64748b',
    },
    badge: {
        backgroundColor: '#e6f1fb',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginTop: 2,
    },
    badgeText: {
        fontSize: 9,
        color: '#185fa5',
    },
    right: {
        alignItems: 'flex-end',
        gap: 2,
    },
    price: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1e293b',
    },
    time: {
        fontSize: 9,
        color: '#94a3b8',
    },
});