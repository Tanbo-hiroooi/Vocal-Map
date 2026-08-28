import { AppBrand } from '@/components/common/AppBrand';
import { colors } from '@/constants/theme';
import { Tabs } from 'expo-router';
import React from 'react';
import { ColorValue, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Icon = ({ text, color }: { text: string; color: ColorValue }) => <Text aria-hidden style={{ fontSize: 24, fontWeight: '800', color }}>{text}</Text>;

export function AppTabs() {
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={{
    headerTitle: () => <AppBrand compact />,
    headerTitleAlign: 'left',
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    tabBarActiveTintColor: colors.text,
    tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontSize: 14, fontWeight: '800' },
    tabBarItemStyle: { borderRadius: 14, marginHorizontal: 5, marginVertical: 5 },
    tabBarStyle: { height: 64 + insets.bottom, paddingTop: 4, paddingBottom: insets.bottom, backgroundColor: colors.surface, borderTopColor: colors.border },
    tabBarHideOnKeyboard: true,
  }}>
    <Tabs.Screen name="index" options={{ title: '曲', tabBarAccessibilityLabel: '曲一覧', tabBarActiveBackgroundColor: colors.primarySoft, tabBarIcon: ({ color }) => <Icon text="♫" color={color} /> }} />
    <Tabs.Screen name="symbols" options={{ title: '記号', tabBarAccessibilityLabel: '記号辞書', tabBarActiveBackgroundColor: colors.mint, tabBarIcon: ({ color }) => <Icon text="↗" color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: '設定', tabBarAccessibilityLabel: '設定', tabBarActiveBackgroundColor: colors.sunshine, tabBarIcon: ({ color }) => <Icon text="⚙" color={color} /> }} />
  </Tabs>;
}
