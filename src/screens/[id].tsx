import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, TextInput, Alert, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Plus, Target, TrendingUp } from 'lucide-react-native';

import { useStockDetail } from '../hooks/useStockDetail';
import { TradeService } from '../services/stock/trade.service';
import { TradeActionCard } from '../components/TradeActionCard';
import { TradeAction, TradePlan, TradeDirection } from '../types/stock';

type TabType = 'trades' | 'plans';

export default function StockDetailScreen() {
    const route = useRoute();
    const { id } = route.params as { id: string };

    const { stock, loading, actions } = useStockDetail(id);

    // Tab State
    const [activeTab, setActiveTab] = useState<TabType>('trades');

    // Modal States
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<TradeAction | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<TradePlan | null>(null);

    // Form State'leri
    const [isPlanned, setIsPlanned] = useState(false);
    const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
    const [buyPrice, setBuyPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [note, setNote] = useState('');

    const [sellPrice, setSellPrice] = useState('');
    const [convertQuantity, setConvertQuantity] = useState('');
    const [convertBuyPrice, setConvertBuyPrice] = useState('');

    const onAddSubmit = async () => {
        if (!buyPrice || isNaN(Number(buyPrice))) {
            Alert.alert("Hata", "Lütfen geçerli bir giriş fiyatı girin.");
            return;
        }

        if (isPlanned) {
            // PLANLI İŞLEM EKLE
            if (!note.trim()) {
                Alert.alert("Hata", "Plan için 'Neden bu işleme giriyorsun?' alanı zorunludur.");
                return;
            }

            await actions.addPlan({
                direction,
                buyPrice: Number(buyPrice),
                stopLoss: stopLoss ? Number(stopLoss) : undefined,
                takeProfit: takeProfit ? Number(takeProfit) : undefined,
                note: note.trim()
            });

            Alert.alert("Başarılı", "Plan kaydedildi! İstediğiniz zaman gerçek işleme çevirebilirsiniz.");
        } else {
            // GERÇEK İŞLEM EKLE
            if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
                Alert.alert("Hata", "Gerçek işlem için miktar (adet) zorunludur.");
                return;
            }

            await actions.addTrade({
                direction,
                buyPrice: Number(buyPrice),
                quantity: Number(quantity),
                stopLoss: stopLoss ? Number(stopLoss) : undefined,
                takeProfit: takeProfit ? Number(takeProfit) : undefined,
                note: note.trim() || undefined
            });

            Alert.alert("Başarılı", "Gerçek işlem açıldı!");
        }

        // Formu sıfırla
        resetForm();
    };

    const resetForm = () => {
        setBuyPrice('');
        setQuantity('');
        setStopLoss('');
        setTakeProfit('');
        setNote('');
        setIsPlanned(false);
        setIsAddModalVisible(false);
    };

    const onClosePositionSubmit = async () => {
        if (!sellPrice || isNaN(Number(sellPrice)) || !selectedTrade) return;

        await actions.closePosition(selectedTrade.id, Number(sellPrice));
        setSelectedTrade(null);
        setSellPrice('');
        Alert.alert("Başarılı", "Pozisyon kapatıldı!");
    };

    const onDeleteTradeClick = (tradeId: string) => {
        Alert.alert("İşlemi Sil", "Bu kaydı silmek istediğinize emin misiniz?", [
            { text: "Vazgeç", style: "cancel" },
            {
                text: "Sil",
                style: "destructive",
                onPress: async () => {
                    await actions.deleteTrade(tradeId);
                    setSelectedTrade(null);
                }
            }
        ]);
    };

    const onDeletePlanClick = (planId: string) => {
        Alert.alert("Planı Sil", "Bu planı silmek istediğinize emin misiniz?", [
            { text: "Vazgeç", style: "cancel" },
            {
                text: "Sil",
                style: "destructive",
                onPress: async () => {
                    await actions.deletePlan(planId);
                    setSelectedPlan(null);
                }
            }
        ]);
    };

    const onConvertPlanToTrade = async () => {
        if (!selectedPlan) return;
        if (!convertQuantity || isNaN(Number(convertQuantity)) || Number(convertQuantity) <= 0) {
            Alert.alert("Hata", "Lütfen geçerli bir miktar girin.");
            return;
        }

        const actualPrice = convertBuyPrice ? Number(convertBuyPrice) : undefined;
        await actions.convertPlanToTrade(selectedPlan.id, Number(convertQuantity), actualPrice);

        setSelectedPlan(null);
        setConvertQuantity('');
        setConvertBuyPrice('');
        Alert.alert("Başarılı", "Plan gerçek işleme dönüştürüldü!");
    };

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
    if (!stock) return (
        <View style={styles.container}>
            <Text style={styles.emptyText}>Hisse verisi yüklenemedi.</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{stock.symbol}</Text>
                <Text style={styles.subtitle}>{stock.name}</Text>
            </View>

            {/* TAB BAR */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'trades' && styles.tabActive]}
                    onPress={() => setActiveTab('trades')}
                >
                    <TrendingUp size={18} color={activeTab === 'trades' ? '#3b82f6' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'trades' && styles.tabTextActive]}>
                        Gerçek İşlemler ({stock.history.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'plans' && styles.tabActive]}
                    onPress={() => setActiveTab('plans')}
                >
                    <Target size={18} color={activeTab === 'plans' ? '#9b59b6' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'plans' && styles.tabTextActive]}>
                        Planlar ({stock.plans?.length || 0})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* LİSTELER */}
            {activeTab === 'trades' ? (
                <FlatList
                    data={stock.history}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TradeActionCard
                            trade={item}
                            onPress={() => setSelectedTrade(item)}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>Henüz gerçek işlem yok.</Text>}
                />
            ) : (
                <FlatList
                    data={stock.plans || []}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.planCard}
                            onPress={() => setSelectedPlan(item)}
                        >
                            <View style={styles.planHeader}>
                                <View style={[styles.directionBadge, item.direction === 'LONG' ? styles.longBadge : styles.shortBadge]}>
                                    <Text style={styles.directionText}>{item.direction}</Text>
                                </View>
                                <Text style={styles.planPrice}>{item.buyPrice} ₺</Text>
                            </View>
                            <Text style={styles.planNote} numberOfLines={2}>{item.note}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>Henüz plan yok. Strateji defterinizi oluşturun!</Text>}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
                <Plus color="#fff" size={28} />
            </TouchableOpacity>

            {/* MODAL: YENİ EKLE */}
            <Modal visible={isAddModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentLarge}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalHeader}>Yeni {isPlanned ? 'Plan' : 'İşlem'}</Text>

                            {/* İŞLEM TİPİ */}
                            <View style={styles.typeContainer}>
                                <TouchableOpacity
                                    style={[styles.typeBtn, !isPlanned && styles.realActive]}
                                    onPress={() => setIsPlanned(false)}
                                >
                                    <Text style={[styles.typeText, !isPlanned && { color: '#fff' }]}>✅ GERÇEK İŞLEM</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typeBtn, isPlanned && styles.plannedActive]}
                                    onPress={() => setIsPlanned(true)}
                                >
                                    <Text style={[styles.typeText, isPlanned && { color: '#fff' }]}>📋 PLAN</Text>
                                </TouchableOpacity>
                            </View>

                            {/* YÖN */}
                            <View style={styles.typeContainer}>
                                <TouchableOpacity
                                    style={[styles.typeBtn, direction === 'LONG' && styles.longActive]}
                                    onPress={() => setDirection('LONG')}
                                >
                                    <Text style={[styles.typeText, direction === 'LONG' && { color: '#fff' }]}>ALIŞ (LONG)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typeBtn, direction === 'SHORT' && styles.shortActive]}
                                    onPress={() => setDirection('SHORT')}
                                >
                                    <Text style={[styles.typeText, direction === 'SHORT' && { color: '#fff' }]}>SATIŞ (SHORT)</Text>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder={isPlanned ? "Hedef Giriş Fiyatı (₺) *" : "Giriş Fiyatı (₺) *"}
                                keyboardType="decimal-pad"
                                value={buyPrice}
                                onChangeText={setBuyPrice}
                                placeholderTextColor="#999"
                            />

                            {!isPlanned && (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Miktar (Lot/Adet) *"
                                    keyboardType="numeric"
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    placeholderTextColor="#999"
                                />
                            )}

                            <TextInput
                                style={styles.input}
                                placeholder="Stop Loss (₺)"
                                keyboardType="decimal-pad"
                                value={stopLoss}
                                onChangeText={setStopLoss}
                                placeholderTextColor="#999"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Take Profit (₺)"
                                keyboardType="decimal-pad"
                                value={takeProfit}
                                onChangeText={setTakeProfit}
                                placeholderTextColor="#999"
                            />

                            <TextInput
                                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                placeholder={isPlanned ? "Neden bu işleme giriyorsun? (Zorunlu)" : "İşlem notu (İsteğe bağlı)"}
                                multiline
                                value={note}
                                onChangeText={setNote}
                                placeholderTextColor="#999"
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.saveBtn} onPress={onAddSubmit}>
                                    <Text style={styles.whiteBtnText}>{isPlanned ? 'PLANI KAYDET' : 'İŞLEMİ BAŞLAT'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                                    <Text style={styles.darkBtnText}>İPTAL</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL: GERÇEK İŞLEM DETAYI */}
            <Modal visible={!!selectedTrade} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>İşlem Detayı</Text>
                        {selectedTrade && (
                            <ScrollView>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Yön:</Text>
                                    <View style={[styles.directionBadge, selectedTrade.direction === 'LONG' ? styles.longBadge : styles.shortBadge]}>
                                        <Text style={styles.directionText}>{selectedTrade.direction}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Miktar:</Text>
                                    <Text style={styles.detailValue}>{selectedTrade.quantity} Lot</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Giriş:</Text>
                                    <Text style={styles.detailValue}>{selectedTrade.buyPrice} ₺</Text>
                                </View>

                                {selectedTrade.stopLoss && (
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Stop Loss:</Text>
                                        <Text style={[styles.detailValue, { color: '#e74c3c' }]}>{selectedTrade.stopLoss} ₺</Text>
                                    </View>
                                )}

                                {selectedTrade.takeProfit && (
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Take Profit:</Text>
                                        <Text style={[styles.detailValue, { color: '#2ecc71' }]}>{selectedTrade.takeProfit} ₺</Text>
                                    </View>
                                )}

                                {selectedTrade.note && (
                                    <View style={styles.noteBox}>
                                        <Text style={styles.noteLabel}>Not:</Text>
                                        <Text style={styles.noteText}>{selectedTrade.note}</Text>
                                    </View>
                                )}

                                {selectedTrade.position === 'OPEN' ? (
                                    <View style={{ marginTop: 15 }}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Çıkış Fiyatı (₺)"
                                            keyboardType="decimal-pad"
                                            value={sellPrice}
                                            onChangeText={setSellPrice}
                                            placeholderTextColor="#999"
                                        />
                                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#e67e22' }]} onPress={onClosePositionSubmit}>
                                            <Text style={styles.whiteBtnText}>POZİSYONU KAPAT</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Kâr/Zarar:</Text>
                                        <Text style={[styles.detailValue, {
                                            color: TradeService.calculateProfit(selectedTrade) >= 0 ? '#2ecc71' : '#e74c3c',
                                            fontWeight: 'bold'
                                        }]}>
                                            {TradeService.calculateProfit(selectedTrade).toFixed(2)} ₺
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteTradeClick(selectedTrade.id)}>
                                    <Text style={styles.deleteBtnText}>İŞLEMİ SİL</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                        <TouchableOpacity style={[styles.cancelBtn, { marginTop: 15 }]} onPress={() => setSelectedTrade(null)}>
                            <Text style={styles.darkBtnText}>KAPAT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL: PLAN DETAYI */}
            <Modal visible={!!selectedPlan} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>Plan Detayı</Text>
                        {selectedPlan && (
                            <ScrollView>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Yön:</Text>
                                    <View style={[styles.directionBadge, selectedPlan.direction === 'LONG' ? styles.longBadge : styles.shortBadge]}>
                                        <Text style={styles.directionText}>{selectedPlan.direction}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Hedef Fiyat:</Text>
                                    <Text style={styles.detailValue}>{selectedPlan.buyPrice} ₺</Text>
                                </View>

                                {selectedPlan.stopLoss && (
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Stop Loss:</Text>
                                        <Text style={[styles.detailValue, { color: '#e74c3c' }]}>{selectedPlan.stopLoss} ₺</Text>
                                    </View>
                                )}

                                {selectedPlan.takeProfit && (
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Take Profit:</Text>
                                        <Text style={[styles.detailValue, { color: '#2ecc71' }]}>{selectedPlan.takeProfit} ₺</Text>
                                    </View>
                                )}

                                <View style={styles.noteBox}>
                                    <Text style={styles.noteLabel}>Strateji:</Text>
                                    <Text style={styles.noteText}>{selectedPlan.note}</Text>
                                </View>

                                {/* GERÇEK İŞLEME ÇEVİR */}
                                <View style={styles.convertBox}>
                                    <Text style={styles.convertTitle}>Gerçek İşleme Çevir</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Miktar (Lot/Adet) *"
                                        keyboardType="numeric"
                                        value={convertQuantity}
                                        onChangeText={setConvertQuantity}
                                        placeholderTextColor="#999"
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Gerçek Giriş Fiyatı (Boş bırakılırsa plan fiyatı kullanılır)"
                                        keyboardType="decimal-pad"
                                        value={convertBuyPrice}
                                        onChangeText={setConvertBuyPrice}
                                        placeholderTextColor="#999"
                                    />
                                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#2ecc71' }]} onPress={onConvertPlanToTrade}>
                                        <Text style={styles.whiteBtnText}>İŞLEME DÖNÜŞTÜR</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeletePlanClick(selectedPlan.id)}>
                                    <Text style={styles.deleteBtnText}>PLANI SİL</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                        <TouchableOpacity style={[styles.cancelBtn, { marginTop: 15 }]} onPress={() => setSelectedPlan(null)}>
                            <Text style={styles.darkBtnText}>KAPAT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc', padding: 20 },
    header: { marginBottom: 20, marginTop: 40 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
    subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 15 },

    // Tabs
    tabBar: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#f0f0f0' },
    tabActive: { backgroundColor: '#e3f2fd' },
    tabText: { fontSize: 13, color: '#666', fontWeight: '600' },
    tabTextActive: { color: '#3b82f6' },

    // Plan Card
    planCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#9b59b6', elevation: 2 },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    planPrice: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    planNote: { fontSize: 14, color: '#666', lineHeight: 20 },

    // Badges
    directionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    longBadge: { backgroundColor: '#d5f4e6' },
    shortBadge: { backgroundColor: '#fadbd8' },
    directionText: { fontSize: 12, fontWeight: 'bold', color: '#333' },

    // FAB
    fab: { position: 'absolute', right: 20, bottom: 30, backgroundColor: '#3b82f6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, maxHeight: '85%' },
    modalContentLarge: { backgroundColor: '#fff', borderRadius: 20, padding: 25, maxHeight: '85%' },
    modalHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },

    // Detail Rows
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
    detailLabel: { fontSize: 15, color: '#666' },
    detailValue: { fontSize: 15, fontWeight: '600', color: '#333' },

    // Note Box
    noteBox: { backgroundColor: '#fff9e6', padding: 14, borderRadius: 10, marginTop: 12, borderLeftWidth: 3, borderLeftColor: '#f39c12' },
    noteLabel: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 6 },
    noteText: { fontSize: 14, color: '#333', lineHeight: 20 },

    // Convert Box
    convertBox: { backgroundColor: '#f0f9ff', padding: 16, borderRadius: 12, marginTop: 15, borderWidth: 2, borderColor: '#2ecc71' },
    convertTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },

    // Form Elements
    typeContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    typeBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    longActive: { backgroundColor: '#2ecc71', borderColor: '#2ecc71' },
    shortActive: { backgroundColor: '#e74c3c', borderColor: '#e74c3c' },
    realActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    plannedActive: { backgroundColor: '#9b59b6', borderColor: '#9b59b6' },
    typeText: { fontWeight: '600', color: '#666', fontSize: 13 },
    input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, color: '#000', borderWidth: 1, borderColor: '#eee' },

    // Buttons
    modalButtons: { gap: 10, marginTop: 5 },
    saveBtn: { width: '100%', padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#3b82f6' },
    cancelBtn: { width: '100%', padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#eee' },
    deleteBtn: { marginTop: 20, padding: 12, alignItems: 'center' },
    whiteBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
    darkBtnText: { color: '#333333', fontWeight: 'bold', fontSize: 15 },
    deleteBtnText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 14 }
});