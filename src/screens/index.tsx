import React, { useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    Modal, TextInput, Animated, Platform, UIManager
} from 'react-native';
import { Plus, NotebookPen, Trash2, Edit3 } from 'lucide-react-native';

// Hook ve Bileşenler
import { useStocks } from '../hooks/useStocks';
import { StockCard } from '../components/StockCard';
import { AddStockModal } from '../components/AddStockModal'; // Dosya yolunu kontrol et

export default function HomeScreen() {
    // Tüm karmaşık mantık burada toplandı
    const { stocks, deletingId, animRefs, actions } = useStocks();

    // Sadece bu sayfaya özel UI durumları
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [selectedStockForEdit, setSelectedStockForEdit] = useState<any>(null);
    const [newPrice, setNewPrice] = useState('');

    return (
        <View style={styles.container}>
            {/* Üst Başlık Bölümü */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>Portföy Durumu</Text>
                    <Text style={styles.title}>Yatırım Defterim</Text>
                </View>
                <NotebookPen color="#3b82f6" size={28} />
            </View>

            {/* Hisse Listesi */}
            <FlatList
                data={stocks}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const anim = animRefs.current[item.id] || new Animated.Value(1);
                    const isDeleting = deletingId === item.id;

                    return (
                        <Animated.View style={[styles.cardWrapper, {
                            opacity: anim,
                            transform: [{
                                translateX: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-300, 0]
                                })
                            }]
                        }]}>
                            <View style={{ flex: 1 }}>
                                <StockCard stock={item} />
                                <TouchableOpacity
                                    style={styles.editPriceTrigger}
                                    onPress={() => {
                                        setSelectedStockForEdit(item);
                                        setNewPrice(item.currentPrice?.toString() || '');
                                    }}
                                    disabled={isDeleting}
                                >
                                    <Edit3 size={14} color="#3b82f6" />
                                    <Text style={styles.editPriceText}>Fiyatı Güncelle</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.deleteAction}
                                onPress={() => actions.deleteStock(item.id)}
                                disabled={isDeleting}
                            >
                                <Trash2 color="#e74c3c" size={22} />
                            </TouchableOpacity>
                        </Animated.View>
                    );
                }}
                ListEmptyComponent={<Text style={styles.emptyText}>Henüz hisse eklenmemiş.</Text>}
            />

            {/* Yeni Hisse Ekleme Butonu (FAB) */}
            <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
                <Plus color="white" size={30} />
            </TouchableOpacity>

            {/* MODAL 1: Yeni Hisse Ekleme */}
            <AddStockModal
                isVisible={isAddModalVisible}
                onClose={() => setIsAddModalVisible(false)}
                // Async hatasını gidermek için başına async ekledik
                onSave={async (stock) => {
                    await actions.addStock(stock.symbol, stock.name);
                    setIsAddModalVisible(false);
                }}
            />

            {/* MODAL 2: Manuel Fiyat Güncelleme */}
            <Modal visible={!!selectedStockForEdit} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {selectedStockForEdit?.symbol} - Fiyat Güncelle
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Yeni fiyat (₺)"
                            keyboardType="numeric"
                            value={newPrice}
                            onChangeText={setNewPrice}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={async () => {
                                await actions.updatePrice(selectedStockForEdit, Number(newPrice));
                                setSelectedStockForEdit(null);
                                setNewPrice('');
                            }}
                        >
                            <Text style={styles.btnText}>GÜNCELLE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setSelectedStockForEdit(null)}
                        >
                            <Text style={styles.darkText}>VAZGEÇ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
    welcomeText: { color: '#64748b', fontSize: 14 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    listContent: { padding: 20 },
    cardWrapper: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
    deleteAction: {
        marginLeft: 10, padding: 15, backgroundColor: '#fff',
        borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2',
        justifyContent: 'center', alignItems: 'center'
    },
    editPriceTrigger: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 5 },
    editPriceText: { fontSize: 13, color: '#3b82f6', fontWeight: '600', marginLeft: 4 },
    fab: {
        position: 'absolute', right: 25, bottom: 40, backgroundColor: '#3b82f6',
        width: 60, height: 60, borderRadius: 30, justifyContent: 'center',
        alignItems: 'center', elevation: 8, shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 25, gap: 12 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
    input: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 12, fontSize: 16 },
    saveBtn: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 4 },
    cancelBtn: { backgroundColor: '#e2e8f0', padding: 15, borderRadius: 12, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
    darkText: { color: '#333', fontWeight: 'bold', fontSize: 15 },
    emptyText: { textAlign: 'center', marginTop: 100, color: '#94a3b8', fontSize: 16 }
});