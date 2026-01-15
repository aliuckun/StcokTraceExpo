import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';

// Custom Hook Import
import { useStockDetail } from '../hooks/useStockDetail';

import { TradeActionCard } from '../components/TradeActionCard';
import { TradeAction } from '../types/stock';

export default function StockDetailScreen() {
    const route = useRoute();
    const { id } = route.params as { id: string };

    // Tüm veri çekme ve işlem mantığı hook içinde
    const { stock, loading, actions } = useStockDetail(id);

    // UI States (Modallar ve Formlar için)
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<TradeAction | null>(null);

    // Yeni İşlem Form State'leri
    const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
    const [buyPrice, setBuyPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');

    // Pozisyon Kapatma State'i
    const [sellPrice, setSellPrice] = useState('');

    // HANDLERS
    const onAddTradeSubmit = async () => {
        if (!buyPrice || isNaN(Number(buyPrice))) {
            Alert.alert("Hata", "Lütfen geçerli bir giriş fiyatı girin.");
            return;
        }

        await actions.addTrade({
            direction,
            buyPrice: Number(buyPrice),
            stopLoss: stopLoss ? Number(stopLoss) : undefined,
            takeProfit: takeProfit ? Number(takeProfit) : undefined,
        });

        // Formu sıfırla
        setBuyPrice('');
        setStopLoss('');
        setTakeProfit('');
        setIsAddModalVisible(false);
    };

    const onClosePositionSubmit = async () => {
        if (!sellPrice || isNaN(Number(sellPrice)) || !selectedTrade) return;

        await actions.closePosition(selectedTrade.id, Number(sellPrice));
        setSelectedTrade(null);
        setSellPrice('');
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

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
    if (!stock) return (
        <View style={styles.container}>
            <Text style={styles.emptyText}>Hisse verisi yüklenemedi.</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{stock.symbol} Detayı</Text>
                <Text style={styles.subtitle}>{stock.name}</Text>
            </View>

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
                ListEmptyComponent={<Text style={styles.emptyText}>Henüz işlem kaydı yok.</Text>}
            />

            <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
                <Plus color="#fff" size={28} />
            </TouchableOpacity>

            {/* MODAL 1: YENİ İŞLEM EKLEME */}
            <Modal visible={isAddModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentLarge}>
                        <Text style={styles.modalHeader}>Yeni İşlem Aç</Text>
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
                            placeholder="Giriş Fiyatı (₺) *"
                            keyboardType="decimal-pad"
                            value={buyPrice}
                            onChangeText={setBuyPrice}
                            placeholderTextColor="#999"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Stop Loss (₺) - Opsiyonel"
                            keyboardType="decimal-pad"
                            value={stopLoss}
                            onChangeText={setStopLoss}
                            placeholderTextColor="#999"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Take Profit / Hedef (₺) - Opsiyonel"
                            keyboardType="decimal-pad"
                            value={takeProfit}
                            onChangeText={setTakeProfit}
                            placeholderTextColor="#999"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.saveBtn} onPress={onAddTradeSubmit}>
                                <Text style={styles.whiteBtnText}>İŞLEMİ BAŞLAT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddModalVisible(false)}>
                                <Text style={styles.darkBtnText}>İPTAL</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL 2: İŞLEM DETAYI VE KAPATMA */}
            <Modal visible={!!selectedTrade} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>İşlem Detayları</Text>
                        {selectedTrade && (
                            <View style={styles.modalBody}>
                                <View style={styles.row}>
                                    <Text>Yön:</Text>
                                    <Text style={{ fontWeight: 'bold' }}>{selectedTrade.direction}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text>Giriş Fiyatı:</Text>
                                    <Text style={{ fontWeight: 'bold' }}>{selectedTrade.buyPrice} ₺</Text>
                                </View>

                                {selectedTrade.position === 'OPEN' ? (
                                    <View style={{ marginTop: 10 }}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Çıkış Fiyatı (₺)"
                                            keyboardType="decimal-pad"
                                            value={sellPrice}
                                            onChangeText={setSellPrice}
                                            placeholderTextColor="#999"
                                        />
                                        <TouchableOpacity
                                            style={[styles.saveBtn, { backgroundColor: '#e67e22' }]}
                                            onPress={onClosePositionSubmit}
                                        >
                                            <Text style={styles.whiteBtnText}>POZİSYONU KAPAT</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.row}>
                                        <Text>Kâr/Zarar:</Text>
                                        <Text style={{
                                            fontWeight: 'bold',
                                            color: (selectedTrade.profitValue || 0) >= 0 ? '#2ecc71' : '#e74c3c'
                                        }}>
                                            {selectedTrade.profitValue?.toFixed(2)} ₺
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={{ marginTop: 15, padding: 10 }}
                                    onPress={() => onDeleteTradeClick(selectedTrade.id)}
                                >
                                    <Text style={{ color: '#e74c3c', textAlign: 'center', fontWeight: 'bold' }}>
                                        İŞLEMİ SİL
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.cancelBtn, { marginTop: 10 }]}
                            onPress={() => setSelectedTrade(null)}
                        >
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
    header: { marginBottom: 25, marginTop: 40 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
    subtitle: { fontSize: 16, color: '#666' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
    fab: {
        position: 'absolute', right: 20, bottom: 30, backgroundColor: '#3b82f6',
        width: 56, height: 56, borderRadius: 28, justifyContent: 'center',
        alignItems: 'center', elevation: 5
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '90%', alignSelf: 'center' },
    modalContentLarge: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '90%', alignSelf: 'center' },
    modalHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    modalBody: { gap: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
    typeContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    typeBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    longActive: { backgroundColor: '#2ecc71', borderColor: '#2ecc71' },
    shortActive: { backgroundColor: '#e74c3c', borderColor: '#e74c3c' },
    typeText: { fontWeight: '600', color: '#666' },
    input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, color: '#000', borderWidth: 1, borderColor: '#eee' },
    modalButtons: { gap: 10, marginTop: 5 },
    cancelBtn: { width: '100%', padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#eee' },
    saveBtn: { width: '100%', padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#3b82f6' },
    whiteBtnText: { color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center' },
    darkBtnText: { color: '#333333', fontWeight: 'bold', textAlign: 'center' }
});