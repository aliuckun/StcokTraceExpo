import React from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStocks } from '../hooks/useStocks';
import { TradeService } from '../services/stock/trade.service';

export default function PortfolioSummaryScreen() {
    const navigation = useNavigation();
    const { stocks } = useStocks();

    // HESAPLAMALAR
    const allTrades = stocks.flatMap(s => s.history);
    const closedTrades = allTrades.filter(t => t.position === 'CLOSED');
    const openTrades = allTrades.filter(t => t.position === 'OPEN');

    const realizedPnl = closedTrades.reduce((sum, t) => sum + TradeService.calculateProfit(t), 0);

    const openPnl = stocks.reduce((sum, stock) => {
        if (!stock.currentPrice) return sum;
        return sum + stock.history
            .filter(t => t.position === 'OPEN')
            .reduce((s, t) => {
                const diff = t.direction === 'LONG'
                    ? stock.currentPrice! - t.buyPrice
                    : t.buyPrice - stock.currentPrice!;
                return s + diff * t.quantity;
            }, 0);
    }, 0);

    const totalPnl = realizedPnl + openPnl;
    const totalTrades = allTrades.length;
    const winningTrades = closedTrades.filter(t => TradeService.calculateProfit(t) > 0).length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : null;
    const avgPnl = closedTrades.length > 0 ? realizedPnl / closedTrades.length : null;

    // HİSSE BAZLI PERFORMANS
    const stockPerformance = stocks.map(stock => {
        const closed = stock.history.filter(t => t.position === 'CLOSED');
        const open = stock.history.filter(t => t.position === 'OPEN');

        const realized = closed.reduce((sum, t) => sum + TradeService.calculateProfit(t), 0);
        const unrealized = stock.currentPrice
            ? open.reduce((sum, t) => {
                const diff = t.direction === 'LONG'
                    ? stock.currentPrice! - t.buyPrice
                    : t.buyPrice - stock.currentPrice!;
                return sum + diff * t.quantity;
            }, 0)
            : 0;

        return {
            symbol: stock.symbol,
            name: stock.name,
            totalPnl: realized + unrealized,
            tradeCount: stock.history.length,
        };
    }).filter(s => s.tradeCount > 0)
        .sort((a, b) => b.totalPnl - a.totalPnl);

    const best = stockPerformance[0];
    const worst = stockPerformance[stockPerformance.length - 1];

    const fmt = (val: number) => val.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
    const fmtSigned = (val: number) => `${val >= 0 ? '+' : ''}${fmt(val)} ₺`;

    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* HEADER */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Text style={s.backText}>← Geri</Text>
                </TouchableOpacity>
                <Text style={s.headerSub}>Genel Bakış</Text>
                <Text style={s.headerTitle}>Portföy Özeti</Text>
            </View>

            <ScrollView contentContainerStyle={s.content}>

                {/* TOPLAM KART */}
                <View style={s.totalCard}>
                    <Text style={s.totalLabel}>TOPLAM KAR / ZARAR</Text>
                    <Text style={[s.totalValue, { color: totalPnl >= 0 ? '#7acc9e' : '#f0c0c0' }]}>
                        {fmtSigned(totalPnl)}
                    </Text>
                    <View style={s.totalRow}>
                        <View style={s.totalItem}>
                            <Text style={s.totalItemLabel}>Gerçekleşen</Text>
                            <Text style={[s.totalItemValue, { color: realizedPnl >= 0 ? '#7acc9e' : '#f0c0c0' }]}>
                                {fmtSigned(realizedPnl)}
                            </Text>
                        </View>
                        <View style={s.totalItem}>
                            <Text style={s.totalItemLabel}>Açık Pozisyon</Text>
                            <Text style={[s.totalItemValue, { color: openPnl >= 0 ? '#7acc9e' : '#f0c0c0' }]}>
                                {fmtSigned(openPnl)}
                            </Text>
                        </View>
                        <View style={s.totalItem}>
                            <Text style={s.totalItemLabel}>Hisse Sayısı</Text>
                            <Text style={s.totalItemValueWhite}>{stocks.length}</Text>
                        </View>
                    </View>
                </View>

                {/* İSTATİSTİKLER */}
                <Text style={s.sectionLabel}>İSTATİSTİKLER</Text>
                <View style={s.statsGrid}>
                    <View style={s.statCard}>
                        <Text style={s.statLbl}>Toplam Trade</Text>
                        <Text style={s.statVal}>{totalTrades}</Text>
                    </View>
                    <View style={s.statCard}>
                        <Text style={s.statLbl}>Kazanma Oranı</Text>
                        {winRate !== null ? (
                            <Text style={[s.statVal, { color: winRate >= 50 ? '#1a7a4a' : '#b03030' }]}>
                                %{winRate.toFixed(0)}
                            </Text>
                        ) : (
                            <Text style={s.statValMuted}>Veri yok</Text>
                        )}
                    </View>
                    <View style={s.statCard}>
                        <Text style={s.statLbl}>Açık Pozisyon</Text>
                        <Text style={s.statVal}>{openTrades.length}</Text>
                    </View>
                    <View style={s.statCard}>
                        <Text style={s.statLbl}>Ort. K/Z</Text>
                        {avgPnl !== null ? (
                            <Text style={[s.statVal, { color: avgPnl >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                {fmtSigned(avgPnl)}
                            </Text>
                        ) : (
                            <Text style={s.statValMuted}>Veri yok</Text>
                        )}
                    </View>
                </View>

                {/* HİSSE PERFORMANSI */}
                {stockPerformance.length > 0 && (
                    <>
                        <Text style={[s.sectionLabel, { marginTop: 4 }]}>HİSSE PERFORMANSI</Text>

                        {best && (
                            <View style={s.perfCard}>
                                <View>
                                    <Text style={s.perfSym}>{best.symbol}</Text>
                                    <Text style={s.perfName}>En iyi performans</Text>
                                </View>
                                <View style={s.perfRight}>
                                    <Text style={[s.perfPnl, { color: best.totalPnl >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                        {fmtSigned(best.totalPnl)}
                                    </Text>
                                    <View style={[s.perfBadge, { backgroundColor: best.totalPnl >= 0 ? '#eaf6f0' : '#fdf0f0' }]}>
                                        <Text style={[s.perfBadgeText, { color: best.totalPnl >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                            {best.tradeCount} trade
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {worst && worst.symbol !== best?.symbol && (
                            <View style={s.perfCard}>
                                <View>
                                    <Text style={s.perfSym}>{worst.symbol}</Text>
                                    <Text style={s.perfName}>En kötü performans</Text>
                                </View>
                                <View style={s.perfRight}>
                                    <Text style={[s.perfPnl, { color: worst.totalPnl >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                        {fmtSigned(worst.totalPnl)}
                                    </Text>
                                    <View style={[s.perfBadge, { backgroundColor: worst.totalPnl >= 0 ? '#eaf6f0' : '#fdf0f0' }]}>
                                        <Text style={[s.perfBadgeText, { color: worst.totalPnl >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                            {worst.tradeCount} trade
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* TÜM HİSSELER */}
                        <Text style={[s.sectionLabel, { marginTop: 12 }]}>TÜM HİSSELER</Text>
                        {stockPerformance.map(sp => (
                            <View key={sp.symbol} style={s.perfCard}>
                                <View>
                                    <Text style={s.perfSym}>{sp.symbol}</Text>
                                    <Text style={s.perfName}>{sp.tradeCount} trade</Text>
                                </View>
                                <View style={s.perfRight}>
                                    <Text style={[s.perfPnl, { color: sp.totalPnl >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                        {fmtSigned(sp.totalPnl)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {stockPerformance.length === 0 && (
                    <Text style={s.emptyText}>Henüz trade verisi yok.</Text>
                )}

            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        backgroundColor: '#fff',
        paddingTop: 52,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    backBtn: { marginBottom: 8 },
    backText: { fontSize: 13, color: '#378add' },
    headerSub: { fontSize: 11, color: '#64748b' },
    headerTitle: { fontSize: 20, fontWeight: '500', color: '#1e293b' },
    content: { padding: 14, paddingBottom: 40 },
    totalCard: {
        backgroundColor: '#378add',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
    },
    totalLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 4, letterSpacing: 0.4 },
    totalValue: { fontSize: 28, fontWeight: '500', marginBottom: 14 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
    totalItem: { gap: 2 },
    totalItemLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)' },
    totalItemValue: { fontSize: 13, fontWeight: '500' },
    totalItemValueWhite: { fontSize: 13, fontWeight: '500', color: '#fff' },
    sectionLabel: {
        fontSize: 10,
        color: '#94a3b8',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        padding: 12,
        gap: 4,
    },
    statLbl: { fontSize: 10, color: '#94a3b8', letterSpacing: 0.3 },
    statVal: { fontSize: 15, fontWeight: '500', color: '#1e293b' },
    statValMuted: { fontSize: 13, color: '#94a3b8' },
    perfCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    perfSym: { fontSize: 13, fontWeight: '500', color: '#1e293b' },
    perfName: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
    perfRight: { alignItems: 'flex-end', gap: 4 },
    perfPnl: { fontSize: 14, fontWeight: '500' },
    perfBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    perfBadgeText: { fontSize: 10 },
    emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 40 },
});