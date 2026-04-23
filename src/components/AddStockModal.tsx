import React, { useState } from 'react';
import {
    Modal, View, Text, TextInput,
    TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';

interface Props {
    isVisible: boolean;
    onClose: () => void;
    onSave: (symbol: string, name: string) => void;
}

export const AddStockModal: React.FC<Props> = ({ isVisible, onClose, onSave }) => {
    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');

    const handleSave = () => {
        if (!symbol.trim() || !name.trim()) return;
        onSave(symbol, name);
        setSymbol('');
        setName('');
        onClose();
    };

    return (
        <Modal visible={isVisible} animationType="slide" transparent>
            <View style={s.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={s.sheet}
                >
                    <View style={s.handle} />
                    <Text style={s.title}>Yeni Hisse Ekle</Text>

                    <Text style={s.label}>Sembol</Text>
                    <TextInput
                        style={s.input}
                        placeholder="Örn: THYAO"
                        placeholderTextColor="#94a3b8"
                        value={symbol}
                        onChangeText={setSymbol}
                        autoCapitalize="characters"
                    />

                    <Text style={s.label}>Hisse Adı</Text>
                    <TextInput
                        style={s.input}
                        placeholder="Örn: Türk Hava Yolları"
                        placeholderTextColor="#94a3b8"
                        value={name}
                        onChangeText={setName}
                    />

                    <View style={s.btnRow}>
                        <TouchableOpacity style={s.btnCancel} onPress={onClose}>
                            <Text style={s.btnCancelText}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.btnSave} onPress={handleSave}>
                            <Text style={s.btnSaveText}>Ekle</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '500',
        color: '#1e293b',
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        padding: 13,
        fontSize: 15,
        color: '#1e293b',
        marginBottom: 16,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    btnCancel: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    btnSave: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#378add',
        alignItems: 'center',
    },
    btnCancelText: {
        color: '#64748b',
        fontWeight: '500',
        fontSize: 15,
    },
    btnSaveText: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 15,
    },
});