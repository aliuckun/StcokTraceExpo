import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SupportLevel } from '../types/stock';

interface Props {
    support: SupportLevel;
    currentPrice: number;
    onDelete: () => void;
}

export const SupportCard: React.FC<Props> = ({ support, currentPrice, onDelete }) => {
    const diff = currentPrice - support.price;
    const pct = Math.abs((diff / currentPrice) * 100);
    const isClose = pct <= 2;
    const isMid = pct > 2 && pct <= 8;
    const progressWidth = Math.max(5, 100 - pct * 3);

    const pctColor = isClose ? '#1a7a4a' : '#b03030';
    const progressColor = isClose ? '#7acc9e' : isMid ? '#f5d080' : '#f0c0c0';
    const tag = isClose ? 'Yakın' : isMid ? 'Orta' : 'Uzak';

    return (
        <View style={[s.card, isClose && s.cardClose]}>
            <View style={s.top}>
                <View>
                    <Text style={s.price}>
                        {support.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                </View>
                <View style={s.rightTop}>
                    <Text style={[s.pct, { color: pctColor }]}>
                        %{pct.toFixed(2)} uzakta
                    </Text>
                    <View style={[s.tagWrap, { backgroundColor: isClose ? '#eaf6f0' : isMid ? '#fef9ec' : '#f0f0f0' }]}>
                        <Text style={[s.tagText, { color: isClose ? '#1a7a4a' : isMid ? '#92600a' : '#64748b' }]}>
                            {tag}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={s.progressWrap}>
                <View style={[s.progressFill, {
                    width: `${Math.min(progressWidth, 100)}%`,
                    backgroundColor: progressColor
                }]} />
            </View>

            <View style={s.bottom}>
                <Text style={s.dist}>
                    {Math.abs(diff).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺{' '}
                    {diff > 0 ? 'aşağıda' : 'yukarıda'}
                </Text>
                <TouchableOpacity style={s.deleteBtn} onPress={onDelete}>
                    <Text style={s.deleteText}>Sil</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        padding: 12,
        marginBottom: 8,
    },
    cardClose: {
        borderWidth: 1.5,
        borderColor: '#1a7a4a',
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    price: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1e293b',
    },
    rightTop: {
        alignItems: 'flex-end',
        gap: 5,
    },
    pct: {
        fontSize: 13,
        fontWeight: '500',
    },
    tagWrap: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '500',
    },
    progressWrap: {
        height: 4,
        backgroundColor: '#f0f0f0',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: 4,
        borderRadius: 2,
    },
    bottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dist: {
        fontSize: 11,
        color: '#64748b',
    },
    deleteBtn: {
        backgroundColor: '#fdf0f0',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: '#fca5a5',
    },
    deleteText: {
        fontSize: 12,
        color: '#b03030',
        fontWeight: '500',
    },
});