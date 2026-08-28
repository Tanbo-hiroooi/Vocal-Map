import { colors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function AppBrand({ compact = false }: { compact?: boolean }) {
  return <View style={styles.brand} accessibilityLabel="Vocal Map">
    <View style={[styles.mark, compact && styles.smallMark]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={[styles.note, compact && styles.smallNote]}>♫</Text>
    </View>
    <View style={styles.copy}>
      <Text style={[styles.name, compact && styles.smallName]}>Vocal Map<Text style={styles.dot}>.</Text></Text>
      {!compact && <Text style={styles.tagline}>歌い方を、デザインしよう。</Text>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  mark: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.sunshine, borderWidth: 1.5, borderColor: colors.text, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-7deg' }] },
  smallMark: { width: 32, height: 32, borderRadius: 10 },
  note: { fontSize: 29, fontWeight: '900', color: colors.text },
  smallNote: { fontSize: 23 },
  copy: { flexShrink: 1 },
  name: { fontSize: 25, fontWeight: '900', letterSpacing: -0.9, color: colors.text },
  smallName: { fontSize: 22 },
  dot: { color: colors.primary },
  tagline: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
