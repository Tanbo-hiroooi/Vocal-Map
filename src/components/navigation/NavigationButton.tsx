import { colors } from '@/constants/theme';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import React, { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = Omit<TabTriggerSlotProps, 'children'> & { label: string; icon: string; tone: 'coral' | 'mint' | 'yellow' };
const backgrounds = { coral: colors.primarySoft, mint: colors.mint, yellow: colors.sunshine };

export const NavigationButton = forwardRef<View, Props>(function NavigationButton({ label, icon, tone, isFocused = false, style, ...props }, ref) {
  return <Pressable {...props} ref={ref} accessibilityRole="tab" accessibilityState={{ selected: isFocused }}
    style={(state) => [typeof style === 'function' ? style(state) : style, styles.button, { backgroundColor: backgrounds[tone] }, isFocused && styles.selected, state.pressed && styles.pressed]}>
    <Text aria-hidden style={styles.icon}>{icon}</Text>
    <Text style={[styles.label, isFocused && styles.selectedLabel]}>{label}</Text>
  </Pressable>;
});

const styles = StyleSheet.create({
  button: { flex: 1, minWidth: 0, maxWidth: 150, minHeight: 48, paddingHorizontal: 8, paddingVertical: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderWidth: 2, borderColor: 'transparent', borderRadius: 13 },
  selected: { borderColor: colors.text, borderBottomWidth: 4 },
  icon: { color: colors.text, fontSize: 21, fontWeight: '800' },
  label: { color: colors.text, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  selectedLabel: { fontWeight: '900' },
  pressed: { opacity: 0.75 },
});
