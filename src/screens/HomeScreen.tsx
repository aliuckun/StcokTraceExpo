import React, { useState, useRef } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    TextInput, Animated, StatusBar, ActivityIndicator,
    PanResponder
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useStocks } from '../hooks/useStocks';
import { AddStockModal } from '../components/AddStockModal';
import { Stock } from '../types/stock';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
type SortField = 'symbol' | 'price' | 'change';
type SortDir = 'asc' | 'desc';

const SWIPE_THRESHOLD = -60;
const DELETE_WIDTH = 70;

const SwipeableStockRow: React.FC<{
    stock: Stock;
    onPress: () => void;
    onDelete: () => void;
}> = ({ stock, onPress, onDelete }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const [swiped, setSwiped] = useState(false);
    const hasOpenPosition = stock.history.some(t => t.position === 'OPEN');

    const panResponder = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 && Math.abs(g.dy) < 10,
        onPanResponderMove: (_, g) => {
            if (g.dx < 0) translateX.setValue(Math.max(g.dx, -DELETE_WIDTH));
        },
        onPanResponderRelease: (_, g) => {
            if (g.dx < SWIPE_THRESHOLD) {
                Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true }).start();
                setSwiped(true);
            } else {
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
                setSwiped(false);
            }
        },
    })).current;

    return (
        <View style={sw.rowWrap}>
            <Animated.View style={[sw.row, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
                <TouchableOpacity style={sw.rowInner} onPress={onPress} activeOpacity={0.7}>
                    <View style={[sw.indicator, hasOpenPosition && sw.indicatorActive]} />

                    <View style={sw.symbolRow}>
                        <Text style={sw.symbol}>{stock.symbol}</Text>
                        {stock.currentPrice && stock.supports?.length > 0 &&
                            stock.supports.some(sup =>
                                Math.abs((stock.currentPrice! - sup.price) / stock.currentPrice!) * 100 <= 2
                            ) && (
                                <View style={sw.warnDot} />
                            )
                        }
                    </View>
                    <Text style={sw.symbolTime}>{stock.lastUpdated ?? '--:--'}</Text>

                    <Text style={sw.price}>
                        {stock.currentPrice
                            ? stock.currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })
                            : '---'}
                    </Text>

                    {stock.changePercent !== undefined ? (
                        <Text style={[sw.changePct, {
                            color: stock.changePercent >= 0 ? '#1a7a4a' : '#b03030'
                        }]}>
                            {stock.changePercent >= 0 ? '+' : ''}
                            {stock.changePercent.toFixed(2)}%
                        </Text>
                    ) : (
                        <Text style={sw.changeDash}>---</Text>
                    )}
                </TouchableOpacity>
            </Animated.View>

            {swiped && (
                <TouchableOpacity style={sw.deleteAction} onPress={onDelete}>
                    <Text style={sw.deleteText}>Sil</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default function HomeScreen() {
    const navigation = useNavigation<NavProp>();
    const {
        stocks, searchQuery, setSearchQuery,
        refreshing, lastUpdated, bist100, actions
    } = useStocks();

    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [sortField, setSortField] = useState<SortField>('symbol');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const sortedStocks = [...stocks].sort((a, b) => {
        let val = 0;
        if (sortField === 'symbol') {
            val = a.symbol.localeCompare(b.symbol);
        } else if (sortField === 'price') {
            val = (a.currentPrice ?? 0) - (b.currentPrice ?? 0);
        } else if (sortField === 'change') {
            val = (a.changePercent ?? 0) - (b.changePercent ?? 0);
        }
        return sortDir === 'asc' ? val : -val;
    });

    const sortIcon = (field: SortField) => {
        if (sortField !== field) return '';
        return sortDir === 'asc' ? ' ↑' : ' ↓';
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* HEADER */}
            <View style={s.header}>
                <View>
                    <Text style={s.headerSub}>Portföy</Text>
                    <Text style={s.headerTitle}>Yatırım Defterim</Text>
                </View>
                <View style={s.headerActions}>
                    <TouchableOpacity
                        style={s.btnRefresh}
                        onPress={actions.refreshAllPrices}
                        disabled={refreshing}
                    >
                        {refreshing
                            ? <ActivityIndicator size={14} color="#378add" />
                            : <Text style={s.refreshIcon}>↻</Text>
                        }
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={s.btnAdd}
                        onPress={() => setIsAddModalVisible(true)}
                    >
                        <Text style={s.btnAddText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={s.btnSummary}
                        onPress={() => navigation.navigate('PortfolioSummary')}
                    >
                        <Text style={s.summaryIcon}>◈</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* BIST100 */}
            <View style={s.bistCard}>
                <View>
                    <Text style={s.bistLabel}>BIST 100</Text>
                    <Text style={s.bistTime}>
                        {lastUpdated ? `${lastUpdated} güncellendi` : 'Güncellenmedi'}
                    </Text>
                </View>
                <View style={s.bistRight}>
                    <Text style={s.bistValue}>
                        {bist100
                            ? bist100.last.toLocaleString('tr-TR', { minimumFractionDigits: 2 })
                            : '---'}
                    </Text>
                    {bist100 && (
                        <View style={[s.bistBadge, {
                            backgroundColor: bist100.changePercent >= 0 ? '#eaf6f0' : '#fdf0f0'
                        }]}>
                            <Text style={[s.bistBadgeText, {
                                color: bist100.changePercent >= 0 ? '#1a7a4a' : '#b03030'
                            }]}>
                                {bist100.changePercent >= 0 ? '+' : ''}
                                {bist100.changePercent.toFixed(2)}%
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* ARAMA */}
            <View style={s.searchRow}>
                <View style={s.searchBox}>
                    <Text style={s.searchIcon}>⌕</Text>
                    <TextInput
                        style={s.searchInput}
                        placeholder="Hisse ara..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* TABLO BAŞLIĞI */}
            <View style={s.tableHeader}>
                <TouchableOpacity style={{ flex: 1.5 }} onPress={() => handleSort('symbol')}>
                    <Text style={s.colLabel}>KOD{sortIcon('symbol')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1.5, alignItems: 'flex-end' }} onPress={() => handleSort('price')}>
                    <Text style={s.colLabel}>FİYAT{sortIcon('price')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end' }} onPress={() => handleSort('change')}>
                    <Text style={s.colLabel}>% DEĞ.{sortIcon('change')}</Text>
                </TouchableOpacity>
            </View>

            {/* LİSTE */}
            <FlatList
                data={sortedStocks}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                    <SwipeableStockRow
                        stock={item}
                        onPress={() => navigation.navigate('StockDetail', {
                            stockId: item.id,
                            symbol: item.symbol
                        })}
                        onDelete={() => actions.deleteStock(item.id)}
                    />
                )}
                ListEmptyComponent={
                    <View style={s.emptyWrap}>
                        <Text style={s.emptyText}>
                            {searchQuery ? 'Sonuç bulunamadı.' : 'Henüz hisse eklenmemiş.'}
                        </Text>
                    </View>
                }
            />

            <AddStockModal
                isVisible={isAddModalVisible}
                onClose={() => setIsAddModalVisible(false)}
                onSave={async (symbol, name) => {
                    await actions.addStock(symbol, name);
                    setIsAddModalVisible(false);
                }}
            />
        </View>
    );
}

const sw = StyleSheet.create({
    rowWrap: {
        position: 'relative',
        overflow: 'hidden',
    },
    row: {
        backgroundColor: '#fff',
        zIndex: 1,
    },
    symbolRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    warnDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#f59e0b',
    },
    rowInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f1f5f9',
        gap: 8,
    },
    indicator: {
        width: 3,
        height: 28,
        borderRadius: 2,
        backgroundColor: '#e2e8f0',
        marginRight: 6,
    },
    indicatorActive: {
        backgroundColor: '#378add',
    },
    symbolCol: {
        flex: 1.5,
        gap: 2,
    },
    symbol: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1e293b',
    },
    symbolTime: {
        fontSize: 10,
        color: '#94a3b8',
    },
    price: {
        flex: 1.5,
        fontSize: 13,
        color: '#1e293b',
        textAlign: 'right',
    },
    changePct: {
        flex: 1,
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'right',
    },
    changeDash: {
        flex: 1,
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'right',
    },
    deleteAction: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: DELETE_WIDTH,
        backgroundColor: '#e74c3c',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
});

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        backgroundColor: '#fff',
        paddingTop: 52,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    btnSummary: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f4f8',
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryIcon: {
        fontSize: 16,
        color: '#378add',
    },
    headerSub: { fontSize: 11, color: '#64748b' },
    headerTitle: { fontSize: 20, fontWeight: '500', color: '#1e293b' },
    headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    btnRefresh: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#f0f4f8', borderWidth: 0.5,
        borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center',
    },
    refreshIcon: { fontSize: 18, color: '#378add' },
    btnAdd: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#378add', alignItems: 'center', justifyContent: 'center',
    },
    btnAddText: { color: '#fff', fontSize: 20, lineHeight: 22 },
    bistCard: {
        backgroundColor: '#fff',
        marginHorizontal: 14,
        marginTop: 12,
        marginBottom: 4,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bistLabel: { fontSize: 11, fontWeight: '500', color: '#64748b', letterSpacing: 0.5 },
    bistTime: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
    bistValue: { fontSize: 22, fontWeight: '500', color: '#1e293b', textAlign: 'right', marginBottom: 4 },
    bistRight: { alignItems: 'flex-end', gap: 4 },
    bistBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    bistBadgeText: { fontSize: 13, fontWeight: '500' },
    searchRow: { padding: 10 },
    searchBox: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        gap: 6,
    },
    searchIcon: { fontSize: 16, color: '#94a3b8' },
    searchInput: { flex: 1, height: 38, fontSize: 14, color: '#1e293b' },
    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    colLabel: {
        fontSize: 10,
        color: '#94a3b8',
        letterSpacing: 0.5,
        fontWeight: '500',
    },
    emptyWrap: { alignItems: 'center', marginTop: 60 },
    emptyText: { fontSize: 14, color: '#94a3b8' },
});