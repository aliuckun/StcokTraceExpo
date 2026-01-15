import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Stock } from '../types/stock';
import { Activity } from 'lucide-react-native';

interface StockCardProps {
    stock: Stock;
}

export const StockCard: React.FC<StockCardProps> = ({ stock }) => {
    const navigation = useNavigation<any>();

    const hasOpenPosition = stock.history.some((trade) => trade.position === 'OPEN');
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // İşlem açık olunca animasyon çıkması
    useEffect(() => {
        if (hasOpenPosition) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.03,
                        duration: 1000,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [hasOpenPosition]);

    return (
        <Pressable
            onPress={() => navigation.navigate('StockDetail', { id: stock.id, symbol: stock.symbol })}
        >
            <Animated.View
                style={[
                    styles.card,
                    hasOpenPosition && styles.activeCard,
                    { transform: [{ scale: pulseAnim }] }
                ]}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.symbol}>{stock.symbol}</Text>
                        <Text style={styles.name}>{stock.name}</Text>
                    </View>
                    {hasOpenPosition && (
                        <View style={styles.badge}>
                            <Activity size={12} color="#fff" />
                            <Text style={styles.badgeText}>AÇIK</Text>
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <View>
                        <Text style={styles.label}>Güncel Değer</Text>
                        <Text style={styles.price}>
                            {stock.currentPrice ? `${stock.currentPrice} ₺` : '---'}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.label}>İşlem</Text>
                        <Text style={styles.tradeCount}>{stock.history.length}</Text>
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    activeCard: {
        borderColor: '#3b82f6',
        borderWidth: 2,
        elevation: 5,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        alignItems: 'flex-start',
    },
    symbol: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    name: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    badge: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: 'center',
        gap: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 11,
        color: '#94a3b8',
        marginBottom: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    tradeCount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
    },
});