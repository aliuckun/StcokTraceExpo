import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import HomeScreen from './src/screens/HomeScreen';
import StockDetailScreen from './src/screens/StockDetailScreen';
import PortfolioSummaryScreen from './src/screens/PortfolioSummaryScreen';

export type RootStackParamList = {
    Home: undefined;
    StockDetail: { stockId: string; symbol: string };
    PortfolioSummary: undefined;
};

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const prepare = async () => {
            await SplashScreen.hideAsync();
            await new Promise(resolve => setTimeout(resolve, 1200));
            setReady(true);
        };
        prepare();
    }, []);

    if (!ready) {
        return (
            <View style={styles.splash}>
                <StatusBar hidden />
                <Image
                    source={require('./assets/bcg.png')}
                    style={styles.splashImage}
                    resizeMode="cover"
                />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#1e1f21' } }}
            >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="StockDetail" component={StockDetailScreen} />
                <Stack.Screen name="PortfolioSummary" component={PortfolioSummaryScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        backgroundColor: '#000',
    },
    splashImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});