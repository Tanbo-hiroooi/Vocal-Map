import { colors } from '@/constants/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { running: boolean; expanded: boolean; onOpen(): void; onPause(): void };
export function AutoScrollHeaderButton({ running, expanded, onOpen, onPause }: Props) {
  return <View testID="auto-scroll-header-actions" style={styles.actions}>
    {running ? <>
      <Pressable accessibilityRole="button" accessibilityLabel="自動スクロールをすぐ停止" onPress={onPause} style={[styles.button, styles.stop]}><Text style={styles.text}>■ 停止</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="自動スクロールの操作パネルを開く" accessibilityState={{ expanded }} onPress={onOpen} style={[styles.button, styles.menu]}><Text style={styles.text}>⋯</Text></Pressable>
    </> : <Pressable accessibilityRole="button" accessibilityLabel="自動スクロールの操作パネルを開く" accessibilityState={{ expanded }} onPress={onOpen} style={[styles.button, styles.open]}><Text style={styles.text}>↓ 自動スクロール</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  actions: { width: 112, flexDirection: 'row', alignItems: 'center', gap: 2 },
  button: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, borderRadius: 10, backgroundColor: colors.primarySoft },
  open: { flex: 1 }, stop: { flex: 1 }, menu: { width: 44 }, text: { color: colors.primaryDark, fontWeight: '800', fontSize: 12 },
});
