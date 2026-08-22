import { AppProvider } from '@/features/app/AppProvider';
import { colors } from '@/constants/theme';
import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return <SafeAreaProvider><AppProvider><StatusBar style="auto"/><Stack screenOptions={{headerTintColor:colors.primary,headerBackTitle:'戻る',contentStyle:{backgroundColor:colors.background}}}>
    <Stack.Screen name="(tabs)" options={{headerShown:false}}/>
    <Stack.Screen name="songs/new" options={{title:'新しい曲'}}/>
    <Stack.Screen name="songs/[id]/edit" options={{title:'曲を編集'}}/>
    <Stack.Screen name="songs/[id]/map" options={{title:'Vocal Map'}}/>
    <Stack.Screen name="songs/[id]/practice" options={{title:'Vocal Map'}}/>
  </Stack></AppProvider></SafeAreaProvider>;
}
