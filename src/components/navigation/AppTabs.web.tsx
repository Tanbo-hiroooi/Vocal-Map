import { AppBrand } from '@/components/common/AppBrand';
import { colors, layout, shadow } from '@/constants/theme';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationButton } from './NavigationButton';

export function AppTabs() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < layout.compactWidth;
  const headerWidth = width > 0 ? Math.min(width - (compact ? 24 : 40), layout.maxWidth - 40) : '94%';

  return <Tabs style={[styles.root, { paddingTop: insets.top }]}>
    <TabList testID="primary-navigation" style={[styles.header, { width: headerWidth }]}>
      <View style={[styles.brand, compact && styles.brandCompact]}><AppBrand compact={compact} /></View>
      <TabTrigger name="songs" href="/" asChild><NavigationButton label="曲" icon="♫" tone="coral" accessibilityLabel="曲一覧" /></TabTrigger>
      <TabTrigger name="symbols" href="/symbols" asChild><NavigationButton label="記号" icon="↗" tone="mint" accessibilityLabel="記号辞書" /></TabTrigger>
      <TabTrigger name="settings" href="/settings" asChild><NavigationButton label="設定" icon="⚙" tone="yellow" accessibilityLabel="設定" /></TabTrigger>
    </TabList>
    <TabSlot style={styles.slot} />
  </Tabs>;
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: colors.background },
  header: { alignSelf: 'center', maxWidth: layout.maxWidth - 40, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12, padding: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, ...shadow },
  brand: { flexGrow: 1, flexShrink: 1, minWidth: 205, paddingHorizontal: 4 },
  brandCompact: { width: '100%', minWidth: 0, paddingBottom: 2 },
  slot: { flex: 1, minHeight: 0 },
});
