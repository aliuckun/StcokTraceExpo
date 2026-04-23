import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
    useEffect(() => {
        // Uygulama hazır olunca splash'i kapat
        const hide = async () => {
            await SplashScreen.hideAsync();
        };
        hide();
    }, []);

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{ headerShown: false }}
            >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="StockDetail" component={StockDetailScreen} />
                <Stack.Screen name="PortfolioSummary" component={PortfolioSummaryScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}