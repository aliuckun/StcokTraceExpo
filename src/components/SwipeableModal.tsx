import React, { useRef } from 'react';
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
    const translateY = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, { dy }) => dy > 5,
            onPanResponderMove: (_, { dy }) => {
                if (dy > 0) translateY.setValue(dy);
            },
            onPanResponderRelease: (_, { dy, vy }) => {
                if (dy > 100 || vy > 0.5) {
                    Animated.timing(translateY, {
                        toValue: 700,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        translateY.setValue(0);
                        onClose();
                    });
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

    const handleClose = () => {
        translateY.setValue(0);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); handleClose(); }}>
                <View style={s.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View style={[s.sheet, { transform: [{ translateY }] }]}>
                            {/* Sürüklenebilir handle */}
                            <View {...panResponder.panHandlers} style={s.handleArea}>
                                <View style={s.handle} />
                            </View>
                            {children}
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
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