import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TradeAction } from '../types/stock';
import { TradeService } from '../services/stock/trade.service'; // Servis importu eklendi

interface Props {
    trade: TradeAction;
    onPress: (trade: TradeAction) => void;
}

export const TradeActionCard: React.FC<Props> = ({ trade, onPress }) => {
    // Kar/Zarar değerini dinamik hesaplıyoruz
    const profitValue = TradeService.calculateProfit(trade);
    const isProfit = profitValue >= 0;
    const statusColor = isProfit ? '#2ecc71' : '#e74c3c';

    return (
        <Pressable style={styles.container} onPress={() => onPress(trade)}>
            <View style={[styles.indicator, { backgroundColor: statusColor }]} />
            <View style={styles.content}>
                <View style={styles.infoSide}>
                    <Text style={styles.directionText}>
                        {trade.direction} - {trade.position === 'OPEN' ? 'Açık Pozisyon' : 'Kapatıldı'}
                    </Text>
                    <Text style={styles.quantityText}>
                        {trade.quantity} Lot @ {trade.buyPrice.toFixed(2)} ₺
                    </Text>
                    <Text style={styles.dateText}>
                        {new Date(trade.entryDate).toLocaleDateString()}
                        {trade.exitDate ? ` / ${new Date(trade.exitDate).toLocaleDateString()}` : ''}
                    </Text>
                </View>

                <View style={styles.profitContainer}>
                    <Text style={[styles.profitLabel, { color: statusColor }]}>
                        {isProfit ? 'Kâr' : 'Zarar'}
                    </Text>
                    <Text style={[styles.profitText, { color: statusColor }]}>
                        {isProfit ? '+' : ''}{profitValue.toFixed(2)} ₺
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
        borderRadius: 12,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 2, // Android gölge
        shadowColor: '#000', // iOS gölge
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    indicator: { width: 6 },
    content: {
        flex: 1,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoSide: { flex: 1 },
    directionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2d3436',
        textTransform: 'uppercase'
    },
    quantityText: {
        fontSize: 13,
        color: '#636e72',
        marginTop: 2,
        fontWeight: '500'
    },
    dateText: {
        fontSize: 11,
        color: '#b2bec3',
        marginTop: 4
    },
    profitContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    profitLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: -2
    },
    profitText: {
        fontSize: 17,
        fontWeight: '800'
    },
});