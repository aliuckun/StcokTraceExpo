import React, { useState, useRef } from 'react';
import {
    Modal, View, Text, TextInput,
    TouchableOpacity, StyleSheet, KeyboardAvoidingView,
    Platform, Keyboard, TouchableWithoutFeedback,
    PanResponder, Animated,
} from 'react-native';

interface Props {
    isVisible: boolean;
    onClose: () => void;
    onSave: (symbol: string, name: string) => void;
}

export const AddStockModal: React.FC<Props> = ({ isVisible, onClose, onSave }) => {
    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');

    const translateY = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, { dy }) => dy > 5,
            onPanResponderMove: (_, { dy }) => {
                if (dy > 0) translateY.setValue(dy); // sadece aşağı hareket
            },
            onPanResponderRelease: (_, { dy, vy }) => {
                if (dy > 100 || vy > 0.5) {
                    // Yeterince aşağı çekildi → kapat
                    Animated.timing(translateY, {
                        toValue: 600,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        translateY.setValue(0);
                        onClose();
                    });
                } else {
                    // Yeterli değil → geri yay
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 6,
                    }).start();
                }
            },
        })
    ).current;

    const handleSave = () => {
        if (!symbol.trim() || !name.trim()) return;
        onSave(symbol.trim(), name.trim());
        setSymbol('');
        setName('');
        onClose();
    };

    const handleClose = () => {
        translateY.setValue(0);
        onClose();
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={s.overlay}>
                    <KeyboardAvoidingView
                        behavior="padding"
                        keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
                    >
                        <TouchableWithoutFeedback>
                            <Animated.View style={[s.sheet, { transform: [{ translateY }] }]}>

                                {/* Sürüklenebilir handle */}
                                <View {...panResponder.panHandlers} style={s.handleArea}>
                                    <View style={s.handle} />
                                </View>

                                <Text style={s.title}>Yeni Hisse Ekle</Text>

                                <Text style={s.label}>Sembol</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="Örn: THYAO"
                                    placeholderTextColor="#4b5563"
                                    value={symbol}
                                    onChangeText={setSymbol}
                                    autoCapitalize="characters"
                                    returnKeyType="next"
                                />

                                <Text style={s.label}>Hisse Adı</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="Örn: Türk Hava Yolları"
                                    placeholderTextColor="#4b5563"
                                    value={name}
                                    onChangeText={setName}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSave}
                                />

                                <View style={s.btnRow}>
                                    <TouchableOpacity style={s.btnCancel} onPress={handleClose} activeOpacity={0.7}>
                                        <Text style={s.btnCancelText}>İptal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.btnSave} onPress={handleSave} activeOpacity={0.7}>
                                        <Text style={s.btnSaveText}>Ekle</Text>
                                    </TouchableOpacity>
                                </View>

                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#0f0f0f',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 48,
    },
    handleArea: {
        alignItems: 'center',
        paddingVertical: 8,
        marginTop: -8,
        marginBottom: 12,
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: '#2d2d2d',
        borderRadius: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 6,
        letterSpacing: 0.4,
    },
    input: {
        backgroundColor: '#1c1c1c',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#2d2d2d',
        padding: 13,
        fontSize: 15,
        color: '#ffffff',
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
        backgroundColor: '#1c1c1c',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2d2d2d',
    },
    btnSave: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#1c1c1c',   // ← artık koyu
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2d2d2d',
    },
    btnCancelText: {
        color: '#9ca3af',
        fontWeight: '500',
        fontSize: 15,
    },
    btnSaveText: {
        color: '#ffffff',              // ← beyaz yazı
        fontWeight: '600',
        fontSize: 15,
    },
});