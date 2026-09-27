import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SegmentTextProps, SelectionSurfaceProps } from './LyricSelectionSurface.types';

export function LyricSelectionSurface({ children, accessibilityLabel, onPress, onCharacterPress }: SelectionSurfaceProps) {
  return <Pressable accessible={!onCharacterPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityHint="歌詞の文字をタップして範囲を選びます" onPress={onPress} style={styles.surface}>{children}</Pressable>;
}

export function LyricSegmentText({ text, start, style, selectedRange, onCharacterPress }: SegmentTextProps) {
  if (!onCharacterPress) return <Text style={style}>{text}</Text>;
  let offset = start;
  return <Text style={style}>{Array.from(text).map((character) => {
    const range = { start: offset, end: offset + character.length }; offset = range.end;
    const selected = !!selectedRange && range.start < selectedRange.end && range.end > selectedRange.start;
    return <Text key={range.start} accessibilityRole="button" accessibilityLabel={`${range.start + 1}文字目「${character}」`} accessibilityState={{ selected }} onPress={(event) => { event?.stopPropagation(); onCharacterPress(range); }} style={selected && styles.selected}>{character}</Text>;
  })}</Text>;
}

const styles = StyleSheet.create({
  surface: { width: '100%', maxWidth: '100%', minWidth: 0, minHeight: 44, alignSelf: 'stretch', justifyContent: 'center' },
  selected: { textDecorationLine: 'underline', textDecorationColor: '#C34734' },
});
