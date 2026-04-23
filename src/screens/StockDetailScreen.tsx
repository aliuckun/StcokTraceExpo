import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    StatusBar, ActivityIndicator, Modal, TextInput, Alert, Linking
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useStockDetail } from '../hooks/useStockDetail';
import { SupportCard } from '../components/SupportCard';
import { TradeService } from '../services/stock/trade.service';
import { BorsajsService } from '../services/api/borsajs.service';
import { TradeAction } from '../types/stock';

type RouteProps = RouteProp<RootStackParamList, 'StockDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'StockDetail'>;
type Tab = 'positions' | 'supports' | 'news';
type FilterDir = 'ALL' | 'LONG' | 'SHORT';
type FilterStatus = 'ALL' | 'OPEN' | 'CLOSED';

export default function StockDetailScreen() {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavProp>();
    const { stockId } = route.params;
    const { stock, loading, refreshing, actions } = useStockDetail(stockId);

    const [activeTab, setActiveTab] = useState<Tab>('positions');
    const [news, setNews] = useState<any[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [filterDir, setFilterDir] = useState<FilterDir>('ALL');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

    const [addTradeVisible, setAddTradeVisible] = useState(false);
    const [addSupportVisible, setAddSupportVisible] = useState(false);
    const [closeTradeVisible, setCloseTradeVisible] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<TradeAction | null>(null);

    const [tradeDirection, setTradeDirection] = useState<'LONG' | 'SHORT'>('LONG');
    const [tradeBuyPrice, setTradeBuyPrice] = useState('');
    const [tradeQuantity, setTradeQuantity] = useState('');
    const [tradeStopLoss, setTradeStopLoss] = useState('');
    const [tradeTakeProfit, setTradeTakeProfit] = useState('');
    const [tradeNote, setTradeNote] = useState('');
    const [supportPrice, setSupportPrice] = useState('');
    const [sellPrice, setSellPrice] = useState('');

    useEffect(() => {
        if (activeTab === 'news' && stock) {
            setNewsLoading(true);
            BorsajsService.getNews(stock.symbol)
                .then(setNews)
                .catch(() => setNews([]))
                .finally(() => setNewsLoading(false));
        }
    }, [activeTab, stock?.symbol]);

    if (loading) {
        return (
            <View style={s.loadingWrap}>
                <ActivityIndicator color="#378add" />
            </View>
        );
    }

    if (!stock) {
        return (
            <View style={s.loadingWrap}>
                <Text style={s.emptyText}>Hisse bulunamadı.</Text>
            </View>
        );
    }

    const filteredHistory = stock.history.filter(t => {
        const dirMatch = filterDir === 'ALL' || t.direction === filterDir;
        const statusMatch = filterStatus === 'ALL' || t.position === filterStatus;
        return dirMatch && statusMatch;
    });

    const openTrades = filteredHistory.filter(t => t.position === 'OPEN');
    const closedTrades = filteredHistory.filter(t => t.position === 'CLOSED');

    const handleAddTrade = async () => {
        if (!tradeBuyPrice || !tradeQuantity) return;
        await actions.addTrade({
            direction: tradeDirection,
            buyPrice: parseFloat(tradeBuyPrice),
            quantity: parseFloat(tradeQuantity),
            stopLoss: tradeStopLoss ? parseFloat(tradeStopLoss) : undefined,
            takeProfit: tradeTakeProfit ? parseFloat(tradeTakeProfit) : undefined,
            note: tradeNote || undefined,
        });
        setAddTradeVisible(false);
        setTradeBuyPrice('');
        setTradeQuantity('');
        setTradeStopLoss('');
        setTradeTakeProfit('');
        setTradeNote('');
    };

    const handleClosePosition = async () => {
        if (!selectedTrade || !sellPrice) return;
        await actions.closePosition(selectedTrade.id, parseFloat(sellPrice));
        setCloseTradeVisible(false);
        setSelectedTrade(null);
        setSellPrice('');
    };

    const handleAddSupport = async () => {
        if (!supportPrice) return;
        await actions.addSupport(parseFloat(supportPrice));
        setAddSupportVisible(false);
        setSupportPrice('');
    };

    const handleDeleteTrade = (tradeId: string) => {
        Alert.alert('İşlemi Sil', 'Bu işlemi silmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => actions.deleteTrade(tradeId) }
        ]);
    };

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

                <View style={s.headerMain}>
                    <View>
                        <Text style={s.symbol}>{stock.symbol}</Text>
                        <Text style={s.stockName}>{stock.name}</Text>
                    </View>
                    <View style={s.priceWrap}>
                        <Text style={s.price}>
                            {stock.currentPrice
                                ? `${stock.currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
                                : '---'}
                        </Text>
                        {stock.lastUpdated && (
                            <Text style={s.updateTime}>{stock.lastUpdated} güncellendi</Text>
                        )}
                        <TouchableOpacity
                            onPress={actions.refreshPrice}
                            disabled={refreshing}
                            style={s.refreshBtn}
                        >
                            {refreshing
                                ? <ActivityIndicator size={12} color="#378add" />
                                : <Text style={s.refreshText}>↻</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>

                {/* SEGMENT */}
                <View style={s.segmentWrap}>
                    {(['positions', 'supports', 'news'] as Tab[]).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[s.seg, activeTab === tab && s.segActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[s.segText, activeTab === tab && s.segTextActive]}>
                                {tab === 'positions' ? 'Pozisyonlar'
                                    : tab === 'supports' ? 'Destekler'
                                        : 'Haberler'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* İÇERİK */}
            <ScrollView style={s.content} contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>

                {/* POZİSYONLAR */}
                {activeTab === 'positions' && (
                    <View>
                        {/* İSTATİSTİK KARTLARI */}
                        {stock.history.length > 0 && (() => {
                            const closed = stock.history.filter(t => t.position === 'CLOSED');
                            const open = stock.history.filter(t => t.position === 'OPEN');
                            const realizedPnl = closed.reduce((sum, t) => sum + TradeService.calculateProfit(t), 0);
                            const openPnl = stock.currentPrice
                                ? open.reduce((sum, t) => {
                                    const diff = t.direction === 'LONG'
                                        ? stock.currentPrice! - t.buyPrice
                                        : t.buyPrice - stock.currentPrice!;
                                    return sum + diff * t.quantity;
                                }, 0)
                                : null;
                            const totalTrades = stock.history.length;
                            const winningTrades = closed.filter(t => TradeService.calculateProfit(t) > 0).length;
                            const winRate = closed.length > 0 ? (winningTrades / closed.length) * 100 : null;
                            const avgPnl = closed.length > 0 ? realizedPnl / closed.length : null;

                            return (
                                <View style={s.statsWrap}>
                                    <View style={s.statsRow}>
                                        <View style={s.statCard}>
                                            <Text style={s.statLabel}>Gerçekleşen K/Z</Text>
                                            <Text style={[s.statValue, { color: realizedPnl >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                                {fmtSigned(realizedPnl)}
                                            </Text>
                                        </View>
                                        <View style={s.statCard}>
                                            <Text style={s.statLabel}>Anlık K/Z</Text>
                                            {openPnl !== null ? (
                                                <Text style={[s.statValue, { color: openPnl >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                                    {fmtSigned(openPnl)}
                                                </Text>
                                            ) : (
                                                <Text style={s.statValueMuted}>Fiyat yok</Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={s.statsRow}>
                                        <View style={s.statCard}>
                                            <Text style={s.statLabel}>Toplam Trade</Text>
                                            <Text style={s.statValue}>{totalTrades}</Text>
                                        </View>
                                        <View style={s.statCard}>
                                            <Text style={s.statLabel}>Kazanma Oranı</Text>
                                            {winRate !== null ? (
                                                <Text style={[s.statValue, { color: winRate >= 50 ? '#1a7a4a' : '#b03030' }]}>
                                                    %{winRate.toFixed(0)}
                                                    <Text style={s.statSub}> ({winningTrades}/{closed.length})</Text>
                                                </Text>
                                            ) : (
                                                <Text style={s.statValueMuted}>Veri yok</Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={s.statsRow}>
                                        <View style={s.statCard}>
                                            <Text style={s.statLabel}>Ort. K/Z (Trade)</Text>
                                            {avgPnl !== null ? (
                                                <Text style={[s.statValue, { color: avgPnl >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                                    {fmtSigned(avgPnl)}
                                                </Text>
                                            ) : (
                                                <Text style={s.statValueMuted}>Veri yok</Text>
                                            )}
                                        </View>
                                        <View style={s.statCard}>
                                            <Text style={s.statLabel}>Toplam K/Z</Text>
                                            {openPnl !== null ? (
                                                <Text style={[s.statValue, { color: (realizedPnl + openPnl) >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                                    {fmtSigned(realizedPnl + openPnl)}
                                                </Text>
                                            ) : (
                                                <Text style={[s.statValue, { color: realizedPnl >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                                    {fmtSigned(realizedPnl)}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })()}

                        {/* FİLTRELER */}
                        <View style={s.filterWrap}>
                            <View style={s.filterRow}>
                                {(['ALL', 'LONG', 'SHORT'] as FilterDir[]).map(f => (
                                    <TouchableOpacity
                                        key={f}
                                        style={[s.filterBtn, filterDir === f && s.filterBtnActive]}
                                        onPress={() => setFilterDir(f)}
                                    >
                                        <Text style={[s.filterBtnText, filterDir === f && s.filterBtnTextActive]}>
                                            {f === 'ALL' ? 'Tümü' : f}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={s.filterRow}>
                                {(['ALL', 'OPEN', 'CLOSED'] as FilterStatus[]).map(f => (
                                    <TouchableOpacity
                                        key={f}
                                        style={[s.filterBtn, filterStatus === f && s.filterBtnActive]}
                                        onPress={() => setFilterStatus(f)}
                                    >
                                        <Text style={[s.filterBtnText, filterStatus === f && s.filterBtnTextActive]}>
                                            {f === 'ALL' ? 'Tümü' : f === 'OPEN' ? 'Açık' : 'Kapalı'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* AÇIK POZİSYONLAR */}
                        {filterStatus !== 'CLOSED' && (
                            <>
                                <View style={s.sectionRow}>
                                    <Text style={s.sectionLabel}>AÇIK POZİSYONLAR</Text>
                                    <TouchableOpacity onPress={() => setAddTradeVisible(true)}>
                                        <Text style={s.addBtn}>+ Ekle</Text>
                                    </TouchableOpacity>
                                </View>

                                {openTrades.length === 0 && (
                                    <Text style={s.emptyText}>Açık pozisyon yok.</Text>
                                )}
                                {openTrades.map(trade => {
                                    const profit = stock.currentPrice
                                        ? (trade.direction === 'LONG'
                                            ? stock.currentPrice - trade.buyPrice
                                            : trade.buyPrice - stock.currentPrice) * trade.quantity
                                        : TradeService.calculateProfit(trade);
                                    return (
                                        <View key={trade.id} style={s.tradeCard}>
                                            <View style={s.tradeRow}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={s.tradeDir}>{trade.direction}</Text>
                                                    <Text style={s.tradeDet}>
                                                        {trade.quantity} lot · {trade.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ giriş
                                                    </Text>
                                                    {trade.stopLoss && (
                                                        <Text style={s.tradeSlTp}>SL: {trade.stopLoss.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                                                    )}
                                                    {trade.takeProfit && (
                                                        <Text style={s.tradeSlTp}>TP: {trade.takeProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                                                    )}
                                                    {trade.note && (
                                                        <Text style={s.tradeNote}>{trade.note}</Text>
                                                    )}
                                                </View>
                                                <View style={s.tradeRight}>
                                                    <View style={s.badgeOpen}>
                                                        <Text style={s.badgeOpenText}>Açık</Text>
                                                    </View>
                                                    {stock.currentPrice && (
                                                        <Text style={[s.tradePnl, { color: profit >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                                            {fmtSigned(profit)}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                            <View style={s.tradeActions}>
                                                <TouchableOpacity
                                                    style={s.tradeActionBtn}
                                                    onPress={() => {
                                                        setSelectedTrade(trade);
                                                        setCloseTradeVisible(true);
                                                    }}
                                                >
                                                    <Text style={s.tradeActionText}>Kapat</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={s.tradeActionBtnDanger}
                                                    onPress={() => handleDeleteTrade(trade.id)}
                                                >
                                                    <Text style={s.tradeActionTextDanger}>Sil</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </>
                        )}

                        {/* KAPALI POZİSYONLAR */}
                        {filterStatus !== 'OPEN' && (
                            <>
                                <Text style={[s.sectionLabel, { marginTop: filterStatus === 'CLOSED' ? 0 : 16 }]}>
                                    KAPALI POZİSYONLAR
                                </Text>
                                {closedTrades.length === 0 && (
                                    <Text style={s.emptyText}>Kapalı pozisyon yok.</Text>
                                )}
                                {closedTrades.map(trade => {
                                    const profit = TradeService.calculateProfit(trade);
                                    return (
                                        <View key={trade.id} style={s.tradeCard}>
                                            <View style={s.tradeRow}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={s.tradeDir}>{trade.direction}</Text>
                                                    <Text style={s.tradeDet}>
                                                        {trade.quantity} lot · {trade.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ giriş
                                                    </Text>
                                                    {trade.sellPrice && (
                                                        <Text style={s.tradeDet}>
                                                            {trade.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ çıkış
                                                        </Text>
                                                    )}
                                                    {trade.note && (
                                                        <Text style={s.tradeNote}>{trade.note}</Text>
                                                    )}
                                                </View>
                                                <View style={s.tradeRight}>
                                                    <View style={s.badgeClosed}>
                                                        <Text style={s.badgeClosedText}>Kapalı</Text>
                                                    </View>
                                                    <Text style={[s.tradePnl, { color: profit >= 0 ? '#1a7a4a' : '#b03030' }]}>
                                                        {fmtSigned(profit)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={s.tradeActions}>
                                                <TouchableOpacity
                                                    style={s.tradeActionBtnDanger}
                                                    onPress={() => handleDeleteTrade(trade.id)}
                                                >
                                                    <Text style={s.tradeActionTextDanger}>Sil</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </>
                        )}
                    </View>
                )}

                {/* DESTEKLER */}
                {activeTab === 'supports' && (
                    <View>
                        <View style={s.sectionRow}>
                            <Text style={s.sectionLabel}>DESTEK SEVİYELERİ</Text>
                            <TouchableOpacity onPress={() => setAddSupportVisible(true)}>
                                <Text style={s.addBtn}>+ Ekle</Text>
                            </TouchableOpacity>
                        </View>
                        {stock.supports.length === 0 && (
                            <Text style={s.emptyText}>Henüz destek eklenmemiş.</Text>
                        )}
                        {stock.currentPrice
                            ? [...stock.supports]
                                .sort((a, b) => b.price - a.price)
                                .map(support => (
                                    <SupportCard
                                        key={support.id}
                                        support={support}
                                        currentPrice={stock.currentPrice!}
                                        onDelete={() => actions.removeSupport(support.id)}
                                    />
                                ))
                            : <Text style={s.emptyText}>Fiyat bilgisi yok. Önce fiyat güncelleyin.</Text>
                        }
                    </View>
                )}

                {/* HABERLER */}
                {activeTab === 'news' && (
                    <View>
                        <Text style={s.sectionLabel}>KAP HABERLERİ</Text>
                        {newsLoading && (
                            <ActivityIndicator color="#378add" style={{ marginTop: 20 }} />
                        )}
                        {!newsLoading && news.length === 0 && (
                            <Text style={s.emptyText}>Haber bulunamadı.</Text>
                        )}
                        {!newsLoading && news.map((item, index) => (
                            <View key={index} style={s.newsCard}>
                                <Text style={s.newsDate}>{item.date}</Text>
                                <Text style={s.newsTitle}>{item.title}</Text>
                                {item.url && (
                                    <TouchableOpacity onPress={() =>
                                        Linking.openURL(`https://www.kap.org.tr${item.url}`)
                                    }>
                                        <Text style={s.newsLink}>KAP'ta Görüntüle →</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* İŞLEM EKLE MODAL */}
            <Modal visible={addTradeVisible} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.modalSheet}>
                        <View style={s.modalHandle} />
                        <Text style={s.modalTitle}>İşlem Ekle</Text>
                        <View style={s.dirRow}>
                            {(['LONG', 'SHORT'] as const).map(dir => (
                                <TouchableOpacity
                                    key={dir}
                                    style={[s.dirBtn, tradeDirection === dir && s.dirBtnActive]}
                                    onPress={() => setTradeDirection(dir)}
                                >
                                    <Text style={[s.dirBtnText, tradeDirection === dir && s.dirBtnTextActive]}>
                                        {dir}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={s.inputLabel}>Giriş Fiyatı</Text>
                        <TextInput
                            style={s.input}
                            placeholder="0.00"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={tradeBuyPrice}
                            onChangeText={setTradeBuyPrice}
                        />
                        <Text style={s.inputLabel}>Lot Miktarı</Text>
                        <TextInput
                            style={s.input}
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={tradeQuantity}
                            onChangeText={setTradeQuantity}
                        />
                        <View style={s.slTpRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.inputLabel}>Stop Loss</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="0.00"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                    value={tradeStopLoss}
                                    onChangeText={setTradeStopLoss}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.inputLabel}>Take Profit</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="0.00"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                    value={tradeTakeProfit}
                                    onChangeText={setTradeTakeProfit}
                                />
                            </View>
                        </View>
                        <Text style={s.inputLabel}>Not (opsiyonel)</Text>
                        <TextInput
                            style={s.input}
                            placeholder="İşlem notu..."
                            placeholderTextColor="#94a3b8"
                            value={tradeNote}
                            onChangeText={setTradeNote}
                        />
                        <View style={s.modalBtnRow}>
                            <TouchableOpacity style={s.modalBtnCancel} onPress={() => setAddTradeVisible(false)}>
                                <Text style={s.modalBtnCancelText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.modalBtnSave} onPress={handleAddTrade}>
                                <Text style={s.modalBtnSaveText}>Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* POZİSYON KAPAT MODAL */}
            <Modal visible={closeTradeVisible} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.modalSheet}>
                        <View style={s.modalHandle} />
                        <Text style={s.modalTitle}>Pozisyon Kapat</Text>
                        <Text style={s.inputLabel}>Çıkış Fiyatı</Text>
                        <TextInput
                            style={s.input}
                            placeholder="0.00"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={sellPrice}
                            onChangeText={setSellPrice}
                            autoFocus
                        />
                        <View style={s.modalBtnRow}>
                            <TouchableOpacity style={s.modalBtnCancel} onPress={() => setCloseTradeVisible(false)}>
                                <Text style={s.modalBtnCancelText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.modalBtnSave} onPress={handleClosePosition}>
                                <Text style={s.modalBtnSaveText}>Kapat</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* DESTEK EKLE MODAL */}
            <Modal visible={addSupportVisible} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.modalSheet}>
                        <View style={s.modalHandle} />
                        <Text style={s.modalTitle}>Destek Ekle</Text>
                        <Text style={s.inputLabel}>Destek Fiyatı</Text>
                        <TextInput
                            style={s.input}
                            placeholder="0.00"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={supportPrice}
                            onChangeText={setSupportPrice}
                            autoFocus
                        />
                        <View style={s.modalBtnRow}>
                            <TouchableOpacity style={s.modalBtnCancel} onPress={() => setAddSupportVisible(false)}>
                                <Text style={s.modalBtnCancelText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.modalBtnSave} onPress={handleAddSupport}>
                                <Text style={s.modalBtnSaveText}>Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        backgroundColor: '#fff',
        paddingTop: 52,
        paddingHorizontal: 16,
        paddingBottom: 0,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    backBtn: { marginBottom: 8 },
    backText: { fontSize: 13, color: '#378add' },
    headerMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    symbol: { fontSize: 20, fontWeight: '500', color: '#1e293b' },
    stockName: { fontSize: 11, color: '#64748b', marginTop: 2 },
    priceWrap: { alignItems: 'flex-end', gap: 2 },
    price: { fontSize: 22, fontWeight: '500', color: '#1e293b' },
    updateTime: { fontSize: 10, color: '#94a3b8' },
    refreshBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
    refreshText: { fontSize: 16, color: '#378add' },
    segmentWrap: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 9,
        padding: 2,
        marginBottom: 12,
        gap: 2,
    },
    seg: { flex: 1, paddingVertical: 6, borderRadius: 7, alignItems: 'center' },
    segActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    segText: { fontSize: 12, color: '#64748b' },
    segTextActive: { fontSize: 12, fontWeight: '500', color: '#185fa5' },
    content: { flex: 1 },
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionLabel: { fontSize: 10, color: '#94a3b8', letterSpacing: 0.5 },
    addBtn: { fontSize: 12, color: '#378add' },
    emptyText: { fontSize: 13, color: '#94a3b8', marginTop: 4, marginBottom: 8 },
    statsWrap: { marginBottom: 16, gap: 8 },
    statsRow: { flexDirection: 'row', gap: 8 },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        padding: 12,
        gap: 4,
    },
    statLabel: { fontSize: 10, color: '#94a3b8', letterSpacing: 0.3 },
    statValue: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
    statValueMuted: { fontSize: 13, color: '#94a3b8' },
    statSub: { fontSize: 11, fontWeight: '400' },
    filterWrap: { gap: 6, marginBottom: 12 },
    filterRow: { flexDirection: 'row', gap: 6 },
    filterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
    },
    filterBtnActive: { backgroundColor: '#378add', borderColor: '#378add' },
    filterBtnText: { fontSize: 12, color: '#64748b' },
    filterBtnTextActive: { fontSize: 12, color: '#fff', fontWeight: '500' },
    tradeCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        padding: 12,
        marginBottom: 8,
    },
    tradeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    tradeDir: { fontSize: 13, fontWeight: '500', color: '#1e293b' },
    tradeDet: { fontSize: 11, color: '#64748b', marginTop: 2 },
    tradeSlTp: { fontSize: 11, color: '#64748b', marginTop: 2 },
    tradeNote: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontStyle: 'italic' },
    tradeRight: { alignItems: 'flex-end', gap: 4 },
    tradePnl: { fontSize: 14, fontWeight: '500' },
    badgeOpen: { backgroundColor: '#e6f1fb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    badgeOpenText: { fontSize: 10, color: '#185fa5' },
    badgeClosed: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    badgeClosedText: { fontSize: 10, color: '#64748b' },
    tradeActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
        borderTopWidth: 0.5,
        borderTopColor: '#f1f5f9',
        paddingTop: 8,
    },
    tradeActionBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: '#e6f1fb' },
    tradeActionText: { fontSize: 12, color: '#185fa5' },
    tradeActionBtnDanger: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: '#fdf0f0' },
    tradeActionTextDanger: { fontSize: 12, color: '#b03030' },
    newsCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        padding: 12,
        marginBottom: 8,
        gap: 5,
    },
    newsDate: { fontSize: 10, color: '#94a3b8' },
    newsTitle: { fontSize: 13, color: '#1e293b', lineHeight: 18 },
    newsLink: { fontSize: 12, color: '#378add', marginTop: 2 },
    slTpRow: { flexDirection: 'row', gap: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    modalHandle: { width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '500', color: '#1e293b', marginBottom: 20 },
    dirRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    dirBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 0.5, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#f8fafc' },
    dirBtnActive: { backgroundColor: '#378add', borderColor: '#378add' },
    dirBtnText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
    dirBtnTextActive: { color: '#fff' },
    inputLabel: { fontSize: 12, color: '#64748b', marginBottom: 6 },
    input: { backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 0.5, borderColor: '#e2e8f0', padding: 13, fontSize: 15, color: '#1e293b', marginBottom: 14 },
    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    modalBtnCancel: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
    modalBtnSave: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#378add', alignItems: 'center' },
    modalBtnCancelText: { color: '#64748b', fontWeight: '500', fontSize: 15 },
    modalBtnSaveText: { color: '#fff', fontWeight: '500', fontSize: 15 },
});