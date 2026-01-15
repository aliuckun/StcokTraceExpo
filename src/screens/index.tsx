import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    Modal, TextInput, Alert, LayoutAnimation, Platform, UIManager, Animated
} from 'react-native';
import { Plus, NotebookPen, Trash2, Edit3 } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';

// Servis ve Tip importları - Yeni yapıya göre güncellendi
import { Stock } from '../types/stock';
import { StockService } from '../services/stock/stock.service';
import { StockCard } from '../components/StockCard';

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

    const animRefs = useRef<{ [key: string]: Animated.Value }>({});

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const loadData = async () => {
        // Doğrudan servisten veriyi alıyoruz
        const data = await StockService.getAll();
        setStocks(data);

        data.forEach(stock => {
            if (!animRefs.current[stock.id]) {
                animRefs.current[stock.id] = new Animated.Value(1);
            }
        });
    };

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
                        const anim = animRefs.current[id];

                        Animated.timing(anim, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true,
                        }).start(async () => {
                            // Servis üzerinden silme işlemi
                            await StockService.delete(id);

                            const remainingStocks = stocks.filter(s => s.id !== id);
                            setStocks(remainingStocks);
                            setDeletingId(null);
                            delete animRefs.current[id];
                        });
                    }
                }
            ]
        );
    };

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

        // Servis üzerinden ekleme (upsert)
        await StockService.upsert(newStock);

        setIsAddModalVisible(false);
        setSymbol('');
        setName('');

        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        await loadData();
    };

    const handleUpdatePrice = async () => {
        if (!selectedStockForEdit || !newPrice) return;

        const updatedStock: Stock = {
            ...selectedStockForEdit,
            currentPrice: Number(newPrice)
        };

        // Servis üzerinden güncelleme
        await StockService.upsert(updatedStock);

        setSelectedStockForEdit(null);
        setNewPrice('');

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

            {/* Modallar önceki yapıyla aynı kalabilir veya sadeleştirilebilir */}
            {/* Modal kodları buraya gelecek... */}
        </View>
    );
}

// Stiller önceki kodunuzla aynı kalabilir

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