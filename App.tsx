// App.tsx veya index.tsx (Kök dizindeki ana dosya)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Yazdığın ekranları içe aktar
import HomeScreen from './src/screens/index'; // Eğer ana sayfan buradaysa
import StockDetailScreen from './src/screens/[id]';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ title: 'Yatırım Defterim' }}
                />
                <Stack.Screen
                    name="StockDetail"
                    component={StockDetailScreen}
                    options={{ title: 'Hisse Detayı' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}