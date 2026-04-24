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
type FilterLevel = 'ALL' | 'SUPPORT' | 'RESISTANCE';
type FilterDistance = 'ALL' | 'CLOSE' | 'MID' | 'FAR';

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
    const [filterLevel, setFilterLevel] = useState<FilterLevel>('ALL');
    const [filterDistance, setFilterDistance] = useState<FilterDistance>('ALL');

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
                    <Text style={s.backText}>‹ </Text>
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
                                            <Text style={[s.statValue, { color: realizedPnl >= 0 ? '#4ade80' : '#e23c3c' }]}>
                                                {fmtSigned(realizedPnl)}
                                            </Text>
                                        </View>
                                        <View style={s.statCard}>
                                            <Text style={s.statLabel}>Anlık K/Z</Text>
                                            {openPnl !== null ? (
                                                <Text style={[s.statValue, { color: openPnl >= 0 ? '#4ade80' : '#e23c3c' }]}>
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
                                                <Text style={[s.statValue, { color: winRate >= 50 ? '#4ade80' : '#e23c3c' }]}>
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
                                                <Text style={[s.statValue, { color: avgPnl >= 0 ? '#4ade80' : '#e23c3c' }]}>
                                                    {fmtSigned(avgPnl)}
                                                </Text>
                                            ) : (
                                                <Text style={s.statValueMuted}>Veri yok</Text>
                                            )}
                                        </View>
                                        <View style={s.statCard}>
                                            <Text style={s.statLabel}>Toplam K/Z</Text>
                                            {openPnl !== null ? (
                                                <Text style={[s.statValue, { color: (realizedPnl + openPnl) >= 0 ? '#4ade80' : '#e23c3c' }]}>
                                                    {fmtSigned(realizedPnl + openPnl)}
                                                </Text>
                                            ) : (
                                                <Text style={[s.statValue, { color: realizedPnl >= 0 ? '#4ade80' : '#e23c3c' }]}>
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
                                    <TouchableOpacity onPress={() => setAddTradeVisible(true)} style={s.addBtnOutline}>
                                        <Text style={s.addBtnOutlineText}>+ Ekle</Text>
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
                                                        <Text style={[s.tradePnl, { color: profit >= 0 ? '#4ade80' : '#e23c3c' }]}>
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
                                <Text style={[s.sectionLabel, {
                                    marginTop: filterStatus === 'CLOSED' ? 0 : 16,
                                    paddingTop: filterStatus === 'CLOSED' ? 0 : 16,
                                    borderTopWidth: filterStatus === 'CLOSED' ? 0 : 0.5,
                                    borderTopColor: 'rgba(255,255,255,0.15)',
                                }]}>
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
                                                    <Text style={[s.tradePnl, { color: profit >= 0 ? '#4ade80' : '#e23c3c' }]}>
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
                            <Text style={s.sectionLabel}>DESTEK / DİRENÇ SEVİYELERİ</Text>
                            <TouchableOpacity onPress={() => setAddSupportVisible(true)} style={s.addBtnOutline}>
                                <Text style={s.addBtnOutlineText}>+ Ekle</Text>
                            </TouchableOpacity>
                        </View>

                        {/* FİLTRELER */}
                        <View style={s.filterWrap}>
                            <View style={s.filterRow}>
                                {([
                                    { key: 'ALL', label: 'Tümü' },
                                    { key: 'SUPPORT', label: 'Destek' },
                                    { key: 'RESISTANCE', label: 'Direnç' },
                                ] as { key: FilterLevel; label: string }[]).map(f => (
                                    <TouchableOpacity
                                        key={f.key}
                                        style={[s.filterBtn, filterLevel === f.key && s.filterBtnActive]}
                                        onPress={() => setFilterLevel(f.key)}
                                    >
                                        <Text style={[s.filterBtnText, filterLevel === f.key && s.filterBtnTextActive]}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={s.filterRow}>
                                {([
                                    { key: 'ALL', label: 'Tümü' },
                                    { key: 'CLOSE', label: 'Yakın (%0-2)' },
                                    { key: 'MID', label: 'Orta (%2-8)' },
                                    { key: 'FAR', label: 'Uzak (%8+)' },
                                ] as { key: FilterDistance; label: string }[]).map(f => (
                                    <TouchableOpacity
                                        key={f.key}
                                        style={[s.filterBtn, filterDistance === f.key && s.filterBtnActive]}
                                        onPress={() => setFilterDistance(f.key)}
                                    >
                                        <Text style={[s.filterBtnText, filterDistance === f.key && s.filterBtnTextActive]}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {stock.supports.length === 0 && (
                            <Text style={s.emptyText}>Henüz seviye eklenmemiş.</Text>
                        )}

                        {stock.currentPrice
                            ? (() => {
                                const filtered = [...stock.supports]
                                    .filter(sup => {
                                        const isSupport = sup.price < stock.currentPrice!;
                                        if (filterLevel === 'SUPPORT' && !isSupport) return false;
                                        if (filterLevel === 'RESISTANCE' && isSupport) return false;

                                        const pct = Math.abs((stock.currentPrice! - sup.price) / stock.currentPrice!) * 100;
                                        if (filterDistance === 'CLOSE' && pct > 2) return false;
                                        if (filterDistance === 'MID' && (pct <= 2 || pct > 8)) return false;
                                        if (filterDistance === 'FAR' && pct <= 8) return false;

                                        return true;
                                    })
                                    .sort((a, b) => {
                                        const pctA = Math.abs((stock.currentPrice! - a.price) / stock.currentPrice!) * 100;
                                        const pctB = Math.abs((stock.currentPrice! - b.price) / stock.currentPrice!) * 100;
                                        return pctA - pctB;
                                    })

                                if (filtered.length === 0) {
                                    return <Text style={s.emptyText}>Filtreye uygun seviye bulunamadı.</Text>;
                                }

                                return filtered.map(support => (
                                    <SupportCard
                                        key={support.id}
                                        support={support}
                                        currentPrice={stock.currentPrice!}
                                        onDelete={() => actions.removeSupport(support.id)}
                                    />
                                ));
                            })()
                            : <Text style={s.emptyText}>Fiyat bilgisi yok. Önce fiyat güncelleyin.</Text>
                        }
                    </View>
                )}

                {/* HABERLER */}
                {activeTab === 'news' && (
                    <View>
                        <Text style={[s.sectionLabel, { fontSize: 14, marginBottom: 12 }]}>KAP HABERLERİ</Text>
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
    addBtnOutline: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    addBtnOutlineText: {
        fontSize: 12,
        color: '#ffffff',
    },
    tradeDet: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
    tradeSlTp: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
    tradeNote: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontStyle: 'italic' },
    stockName: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    updateTime: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
    newsDate: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
    newsTitle: { fontSize: 14, color: '#ffffff', lineHeight: 18 },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.3 },
    statSub: { fontSize: 12, fontWeight: '400', color: 'rgba(255,255,255,0.85)' },
    sectionLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5 },
    emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 4, marginBottom: 8 },
    filterBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    badgeClosedText: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
    segText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    dirBtnText: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
    inputLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 6 },
    modalBtnCancelText: { color: 'rgba(255,255,255,0.85)', fontWeight: '500', fontSize: 16 },
    dist: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

    filterBtnActive: { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.6)' },
    filterBtnTextActive: { fontSize: 12, color: '#ffffff', fontWeight: '500' },

    addBtn: { fontSize: 12, color: '#ffffff' },

    badgeOpen: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)' },
    badgeOpenText: { fontSize: 10, color: '#ffffff' },

    tradeActionBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)' },
    tradeActionText: { fontSize: 12, color: '#ffffff' },

    modalTitle: { fontSize: 18, fontWeight: '500', color: '#ffffff', marginBottom: 20 },
    dirBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    dirBtnActive: { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.6)' },

    dirBtnTextActive: { color: '#ffffff' },

    input: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', padding: 13, fontSize: 15, color: '#ffffff', marginBottom: 14 },
    modalBtnCancel: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
    modalBtnSave: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center' },
    modalBtnSaveText: { color: '#ffffff', fontWeight: '500', fontSize: 15 },




    container: { flex: 1, backgroundColor: '#232323' },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#161718' },

    header: {
        backgroundColor: '#1e1f21',
        paddingTop: 52,
        paddingHorizontal: 16,
        paddingBottom: 0,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255,255,255,0.12)',
    },
    backBtn: {
        marginBottom: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: { fontSize: 18, color: '#ffffff', lineHeight: 15, includeFontPadding: false },
    headerMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    symbol: { fontSize: 20, fontWeight: '500', color: '#ffffff' },

    priceWrap: { alignItems: 'flex-end', gap: 2 },
    price: { fontSize: 22, fontWeight: '500', color: '#ffffff' },

    refreshBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    refreshText: { fontSize: 18, color: '#ffffff', lineHeight: 17, includeFontPadding: false, marginTop: -2 },

    segmentWrap: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 9,
        padding: 2,
        marginBottom: 12,
        gap: 2,
    },
    seg: { flex: 1, paddingVertical: 6, borderRadius: 7, alignItems: 'center' },
    segActive: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 1,
    },

    segTextActive: { fontSize: 12, fontWeight: '500', color: '#ffffff' },

    content: { flex: 1 },
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },



    statsWrap: { marginBottom: 16, gap: 8 },
    statsRow: { flexDirection: 'row', gap: 8 },
    statCard: {
        flex: 1,
        backgroundColor: '#1e1f21',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.12)',
        padding: 12,
        gap: 4,
    },

    statValue: { fontSize: 14, fontWeight: '500', color: '#ffffff' },
    statValueMuted: { fontSize: 13, color: 'rgba(255,255,255,0.3)' },


    filterWrap: { gap: 6, marginBottom: 12 },
    filterRow: { flexDirection: 'row', gap: 6 },
    filterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.15)',
    },

    tradeCard: {
        backgroundColor: '#1e1f21',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.12)',
        padding: 12,
        marginBottom: 8,
    },
    tradeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    tradeDir: { fontSize: 13, fontWeight: '500', color: '#ffffff' },

    tradeRight: { alignItems: 'flex-end', gap: 4 },
    tradePnl: { fontSize: 14, fontWeight: '500' },

    badgeClosed: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },

    tradeActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(255,255,255,0.08)',
        paddingTop: 8,
    },

    tradeActionBtnDanger: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(231,76,60,0.15)' },
    tradeActionTextDanger: { fontSize: 12, color: '#e74c3c' },

    newsCard: {
        backgroundColor: '#1e1f21',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.12)',
        padding: 12,
        marginBottom: 8,
        gap: 5,
    },


    newsLink: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },

    slTpRow: { flexDirection: 'row', gap: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#1e1f21', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    modalHandle: { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

    dirRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },

    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },

});