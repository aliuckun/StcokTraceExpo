import { useRef } from 'react';
import { Animated } from 'react-native';

export const useStockAnimation = () => {
    const animRefs = useRef<{ [key: string]: Animated.Value }>({});

    const initAnim = (id: string): void => {
        if (!animRefs.current[id]) {
            animRefs.current[id] = new Animated.Value(1);
        }
    };

    const playDeleteAnim = (id: string, onComplete: () => void): void => {
        const anim = animRefs.current[id];
        if (!anim) {
            onComplete();
            return;
        }
        Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            delete animRefs.current[id];
            onComplete();
        });
    };

    return { animRefs, initAnim, playDeleteAnim };
};