import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    Modal, TextInput, Alert, LayoutAnimation, Platform, UIManager, Animated
} from 'react-native';
import { Plus, NotebookPen, Trash2, Edit3 } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';

// Servis ve Tip importları
import { Stock } from '../types/stock';
import { getStocks, upsertStock, deleteStock } from '../services/storage';
import { StockCard } from '../components/StockCard';

// Android animasyon aktivasyonu
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [selectedStockForEdit, setSelectedStockForEdit] = useState<Stock | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const isFocused = useIsFocused();

    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');
    const [newPrice, setNewPrice] = useState('');

    // Her kart için animasyon referansları
    const animRefs = useRef<{ [key: string]: Animated.Value }>({});

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const loadData = async () => {
        const data = await getStocks();
        setStocks(data);

        // Her kart için animasyon değeri oluştur
        data.forEach(stock => {
            if (!animRefs.current[stock.id]) {
                animRefs.current[stock.id] = new Animated.Value(1);
            }
        });
    };

    // SİLME İŞLEMİ: Animasyonlu Silme
    const handleConfirmDelete = (id: string, symbol: string) => {
        Alert.alert(
            "Hisse Silinecek",
            `${symbol} kalıcı olarak silinsin mi?`,
            [
                { text: "Vazgeç", style: "cancel" },
                {
                    text: "SİL",
                    style: "destructive",
                    onPress: async () => {
                        setDeletingId(id);

                        // Animasyon değerini al
                        const anim = animRefs.current[id];

                        // Fade out + slide left animasyonu
                        Animated.parallel([
                            Animated.timing(anim, {
                                toValue: 0,
                                duration: 300,
                                useNativeDriver: true,
                            })
                        ]).start(async () => {
                            // Animasyon bitince sil
                            await deleteStock(id);

                            const remainingStocks = stocks.filter(s => s.id !== id);
                            setStocks(remainingStocks);
                            setDeletingId(null);

                            // Referansı temizle
                            delete animRefs.current[id];
                        });
                    }
                }
            ]
        );
    };

    // EKLEME İŞLEMİ: Kalıcı ve Güvenli
    const handleAddStock = async () => {
        if (!symbol || !name) {
            Alert.alert("Hata", "Lütfen alanları doldurun.");
            return;
        }

        const newStock: Stock = {
            id: Date.now().toString(),
            symbol: symbol.toUpperCase().trim(),
            name: name.trim(),
            history: [],
        };

        // 1. Önce hafızaya kaydet
        await upsertStock(newStock);

        // 2. Modal'ı kapat ve inputları temizle
        setIsAddModalVisible(false);
        setSymbol('');
        setName('');

        // 3. Animasyonla listeye ekle
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

        // 4. Storage'dan güncel listeyi çek ve state'e yaz
        await loadData();
    };

    const handleUpdatePrice = async () => {
        if (!selectedStockForEdit || !newPrice) return;

        const updatedStock: Stock = {
            ...selectedStockForEdit,
            currentPrice: Number(newPrice)
        };

        // 1. Hafızayı güncelle
        await upsertStock(updatedStock);

        // 2. Modal'ı kapat
        setSelectedStockForEdit(null);
        setNewPrice('');

        // 3. Animasyonla güncelle
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        // 4. Listeyi yenile
        await loadData();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>Portföy Durumu</Text>
                    <Text style={styles.title}>Yatırım Defterim</Text>
                </View>
                <NotebookPen color="#3b82f6" size={28} />
            </View>

            <FlatList
                data={stocks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const anim = animRefs.current[item.id] || new Animated.Value(1);
                    const isDeleting = deletingId === item.id;

                    return (
                        <Animated.View
                            style={[
                                styles.cardWrapper,
                                {
                                    opacity: anim,
                                    transform: [
                                        {
                                            translateX: anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-300, 0]
                                            })
                                        },
                                        {
                                            scale: anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.8, 1]
                                            })
                                        }
                                    ]
                                }
                            ]}
                        >
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
                                onPress={() => handleConfirmDelete(item.id, item.symbol)}
                                disabled={isDeleting}
                            >
                                <Trash2 color="#e74c3c" size={22} />
                            </TouchableOpacity>
                        </Animated.View>
                    );
                }}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.emptyText}>Kayıt bulunamadı.</Text>}
            />

            <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
                <Plus color="white" size={30} />
            </TouchableOpacity>

            {/* MODAL: Yeni Hisse */}
            <Modal visible={isAddModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Yeni Hisse</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Sembol (örn: THYAO)"
                            value={symbol}
                            onChangeText={setSymbol}
                            autoCapitalize="characters"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="İsim (örn: Türk Hava Yolları)"
                            value={name}
                            onChangeText={setName}
                        />
                        <TouchableOpacity style={styles.saveBtn} onPress={handleAddStock}>
                            <Text style={styles.btnText}>KAYDET</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => {
                                setIsAddModalVisible(false);
                                setSymbol('');
                                setName('');
                            }}
                        >
                            <Text style={styles.darkText}>İPTAL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL: Fiyat Güncelleme */}
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
                        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdatePrice}>
                            <Text style={styles.btnText}>GÜNCELLE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => {
                                setSelectedStockForEdit(null);
                                setNewPrice('');
                            }}
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
    container: {
        flex: 1,
        backgroundColor: '#f8fafc'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 60
    },
    welcomeText: {
        color: '#64748b',
        fontSize: 14
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b'
    },
    listContent: {
        padding: 20
    },
    cardWrapper: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-start'
    },
    deleteAction: {
        marginLeft: 10,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center'
    },
    editPriceTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginLeft: 5
    },
    editPriceText: {
        fontSize: 13,
        color: '#3b82f6',
        fontWeight: '600',
        marginLeft: 4
    },
    fab: {
        position: 'absolute',
        right: 25,
        bottom: 40,
        backgroundColor: '#3b82f6',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        gap: 12
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8
    },
    input: {
        backgroundColor: '#f1f5f9',
        padding: 15,
        borderRadius: 12,
        fontSize: 16
    },
    saveBtn: {
        backgroundColor: '#3b82f6',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 4
    },
    cancelBtn: {
        backgroundColor: '#e2e8f0',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center'
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15
    },
    darkText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 15
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 100,
        color: '#94a3b8',
        fontSize: 16
    }
});