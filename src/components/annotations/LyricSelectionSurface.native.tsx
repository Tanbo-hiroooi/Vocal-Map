import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { selectionCharacters } from '@/domain/services/textSelection';
import { SegmentTextProps, SelectionSurfaceProps } from './LyricSelectionSurface.types';

export function LyricSelectionSurface({ children, accessibilityLabel, textLength, onPress, onCharacterPress }: SelectionSurfaceProps) {
  return <View testID="lyric-selection-surface" accessibilityLabel={accessibilityLabel} style={styles.surface}>
    {textLength && onCharacterPress ? children : <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}>{children}</Pressable>}
  </View>;
}

export function LyricSegmentText({ text, start, style, selectedRange, onCharacterPress }: SegmentTextProps) {
  if (!onCharacterPress) return <Text style={style}>{text}</Text>;
  return <View style={styles.characters}>{selectionCharacters(text, start).map((character) => {
    const selected = !!selectedRange && character.start < selectedRange.end && character.end > selectedRange.start;
    return <Pressable key={character.start} accessibilityRole="button" accessibilityLabel={`${character.start + 1}文字目「${character.text}」`} accessibilityHint="先頭と末尾の文字を順にタップして範囲を選びます。同じ文字を2回タップすると1文字を選べます。" accessibilityState={{ selected }}
      onPress={(event) => { event?.stopPropagation(); onCharacterPress({ start: character.start, end: character.end }); }}>
      <Text selectable={false} style={[style, { flexShrink: 0 }]}>{character.text}</Text>
      {selected && <View pointerEvents="none" testID="selection-character-underline" style={styles.underline} />}
    </Pressable>;
  })}</View>;
}
const styles = StyleSheet.create({
  surface: { width: '100%', maxWidth: '100%', minWidth: 0, minHeight: 44, alignSelf: 'stretch', justifyContent: 'center' },
  characters: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', maxWidth: '100%', minWidth: 0, flexShrink: 1 },
  underline: { position: 'absolute', bottom: 0, left: 0, right: 0, borderBottomWidth: 2, borderColor: '#2261CF' },
});
