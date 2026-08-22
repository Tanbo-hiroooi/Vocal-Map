import { TextRange } from '@/domain/models';
import React, { PropsWithChildren } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

export function LyricSelectionSurface({ children, accessibilityLabel, onPress }: PropsWithChildren<{ accessibilityLabel: string; textLength: number; onPress(): void; onRangeSelect?(range: TextRange): void }>) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityHint="記号を追加または削除します" onPress={onPress} style={({ pressed }) => [styles.surface, pressed && styles.pressed]}>{children}</Pressable>;
}

export function LyricSegmentText({ text, style }: { text: string; start: number; style: StyleProp<TextStyle> }) {
  return <Text style={style}>{text}</Text>;
}

const styles = StyleSheet.create({
  surface: { minHeight: 44, justifyContent: 'center' },
  pressed: { opacity: .7 },
});
