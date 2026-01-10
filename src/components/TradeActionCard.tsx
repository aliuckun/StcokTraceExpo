import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TradeAction } from '../types/stock';

interface Props {
    trade: TradeAction;
    onPress: (trade: TradeAction) => void;
}

export const TradeActionCard: React.FC<Props> = ({ trade, onPress }) => {
    const isProfit = (trade.profitValue || 0) >= 0;
    const statusColor = isProfit ? '#2ecc71' : '#e74c3c';

    return (
        <Pressable style={styles.container} onPress={() => onPress(trade)}>
            <View style={[styles.indicator, { backgroundColor: statusColor }]} />
            <View style={styles.content}>
                <View>
                    <Text style={styles.directionText}>{trade.direction} - {trade.position}</Text>
                    <Text style={styles.dateText}>
                        {new Date(trade.entryDate).toLocaleDateString()}
                        {trade.exitDate ? ` / ${new Date(trade.exitDate).toLocaleDateString()}` : ' (Açık)'}
                    </Text>
                </View>
                <View style={styles.profitContainer}>
                    <Text style={[styles.profitText, { color: statusColor }]}>
                        {isProfit ? '+' : ''}{trade.profitValue?.toFixed(2) || '0.00'} ₺
                    </Text>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        marginVertical: 6,
        borderRadius: 10,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    indicator: { width: 6 },
    content: {
        flex: 1,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    directionText: { fontSize: 14, fontWeight: '700', color: '#2d3436' },
    dateText: { fontSize: 12, color: '#b2bec3', marginTop: 4 },
    profitContainer: { alignItems: 'flex-end' },
    profitText: { fontSize: 16, fontWeight: 'bold' },
});