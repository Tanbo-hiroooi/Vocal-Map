import { colors } from '@/constants/theme';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <View style={styles.row}>
    <View style={styles.copy}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
    {action}
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  copy: { flexGrow: 1, flexShrink: 1, flexBasis: 210, minWidth: 0, gap: 4 },
  eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  title: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.8 },
  description: { color: colors.muted, fontSize: 13, lineHeight: 20 },
});
