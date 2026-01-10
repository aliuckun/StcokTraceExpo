import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Stock } from '../types/stock';

interface AddStockModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSave: (stock: Stock) => void;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({ isVisible, onClose, onSave }) => {
    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');

    const handleSave = () => {
        if (!symbol || !name) return;

        const newStock: Stock = {
            id: Date.now().toString(),
            symbol: symbol.toUpperCase().trim(),
            name: name.trim(),
            history: [], // Yeni hisse defter kaydı boş başlar
        };

        onSave(newStock);
        setSymbol('');
        setName('');
        onClose();
    };

    return (
        <Modal visible={isVisible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContent}
                >
                    <Text style={styles.title}>Yeni Hisse Ekle</Text>

                    <Text style={styles.label}>Sembol</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Örn: THYAO"
                        value={symbol}
                        onChangeText={setSymbol}
                        autoCapitalize="characters"
                    />

                    <Text style={styles.label}>Hisse Adı</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Örn: Türk Hava Yolları"
                        value={name}
                        onChangeText={setName}
                    />

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>İptal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Ekle</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        paddingBottom: 40
    },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1a1a1a' },
    label: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight: '500' },
    input: {
        backgroundColor: '#f5f6fa',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#eee'
    },
    buttonContainer: { flexDirection: 'row', gap: 12 },
    button: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
    cancelButton: { backgroundColor: '#f1f2f6' },
    saveButton: { backgroundColor: '#3b82f6' },
    cancelButtonText: { color: '#57606f', fontWeight: 'bold' },
    saveButtonText: { color: '#fff', fontWeight: 'bold' }
});