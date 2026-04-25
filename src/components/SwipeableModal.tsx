import React, { useRef, useEffect } from 'react';
import {
    Modal, View, Animated, PanResponder,
    StyleSheet, TouchableWithoutFeedback, Keyboard,
} from 'react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export const SwipeableModal: React.FC<Props> = ({ visible, onClose, children }) => {
    const translateY = useRef(new Animated.Value(700)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    // Açılış animasyonu
    useEffect(() => {
        if (visible) {
            translateY.setValue(700);
            overlayOpacity.setValue(0);
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const dismiss = () => {
        Keyboard.dismiss();
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 700,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose(); // animasyon tamamen bitince kapat → flash yok
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, { dy }) => dy > 5,
            onPanResponderMove: (_, { dy }) => {
                if (dy > 0) translateY.setValue(dy);
            },
            onPanResponderRelease: (_, { dy, vy }) => {
                if (dy > 100 || vy > 0.5) {
                    dismiss();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 6,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <Modal
            visible={visible}
            animationType="none"  // ← yerleşik animasyon kapalı
            transparent
            statusBarTranslucent
            onRequestClose={dismiss}
        >
            <TouchableWithoutFeedback onPress={dismiss}>
                <Animated.View style={[s.overlay, { opacity: overlayOpacity }]}>
                    <TouchableWithoutFeedback>
                        <Animated.View style={[s.sheet, { transform: [{ translateY }] }]}>
                            <View {...panResponder.panHandlers} style={s.handleArea}>
                                <View style={s.handle} />
                            </View>
                            {children}
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#1e1f21',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
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
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
    },
});