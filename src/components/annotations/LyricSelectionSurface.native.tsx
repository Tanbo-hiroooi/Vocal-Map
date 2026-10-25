import React, { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { boundaryAtPoint, CharacterBox, selectionCharacters } from '@/domain/services/textSelection';
import { TextRange } from '@/domain/models';
import { SelectionHandles } from './SelectionHandles';
import { SegmentTextProps, SelectionSurfaceProps } from './LyricSelectionSurface.types';

type Measurable = { measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void };
const CharacterRegistry = createContext<(range: TextRange, node: Measurable | null) => void>(() => {});

export function LyricSelectionSurface({ children, accessibilityLabel, textLength, onPress, onCharacterPress, selectedRange, onSelectionEdgeChange, onSelectionDragging }: SelectionSurfaceProps) {
  const root = useRef<View>(null);
  const nodes = useRef(new Map<number, { range: TextRange; node: Measurable }>());
  const origin = useRef({ x: 0, y: 0 });
  const boxesRef = useRef<CharacterBox[]>([]);
  const [layout, setLayout] = useState({ boxes: [] as CharacterBox[], width: 0 });
  const { width, fontScale } = useWindowDimensions();
  const selected = useRef(selectedRange);
  useLayoutEffect(() => { selected.current = selectedRange; }, [selectedRange]);
  const register = useCallback((range: TextRange, node: Measurable | null) => {
    if (node) nodes.current.set(range.start, { range, node });
    else nodes.current.delete(range.start);
  }, []);
  const measure = useCallback(() => {
    if (!selected.current) return;
    root.current?.measureInWindow((x, y, measuredWidth) => {
      origin.current = { x, y };
      const entries = [...nodes.current.values()];
      const boxes: CharacterBox[] = [];
      let remaining = entries.length;
      for (const entry of entries) entry.node.measureInWindow((cx, cy, cw, ch) => {
        if (cw > 0 && ch > 0) boxes.push({ ...entry.range, x: cx - x, y: cy - y, width: cw, height: ch });
        remaining -= 1;
        if (remaining === 0) { boxesRef.current = boxes; setLayout({ boxes, width: measuredWidth }); }
      });
    });
  }, []);
  useLayoutEffect(measure, [measure, selectedRange?.start, selectedRange?.end, width, fontScale]);
  return <CharacterRegistry.Provider value={register}>
    <View ref={root} testID="lyric-selection-surface" accessibilityLabel={accessibilityLabel} onLayout={measure} style={[styles.surface, selectedRange && styles.withHandles]}>
      {textLength && onCharacterPress ? children : <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}>{children}</Pressable>}
      {selectedRange && onSelectionEdgeChange && <SelectionHandles range={selectedRange} boxes={layout.boxes} width={layout.width}
        onDragStart={() => { measure(); onSelectionDragging?.(true); }}
        onDrag={(edge, x, y) => { const index = boundaryAtPoint(boxesRef.current, x - origin.current.x, y - origin.current.y); if (index !== undefined) onSelectionEdgeChange(edge, index); }}
        onDragEnd={() => onSelectionDragging?.(false)} />}
    </View>
  </CharacterRegistry.Provider>;
}

export function LyricSegmentText({ text, start, style, selectedRange, onCharacterPress, onCharacterLongPress }: SegmentTextProps) {
  const register = useContext(CharacterRegistry);
  if (!onCharacterPress) return <Text style={style}>{text}</Text>;
  return <View style={styles.characters}>{selectionCharacters(text, start).map((character) => {
    const selected = !!selectedRange && character.start < selectedRange.end && character.end > selectedRange.start;
    return <Pressable ref={(node) => register(character, node)} key={character.start} accessibilityRole="button" accessibilityLabel={`${character.start + 1}文字目「${character.text}」`} accessibilityHint="長押しすると範囲を選択します" accessibilityState={{ selected }}
      onPress={(event) => { event?.stopPropagation(); onCharacterPress({ start: character.start, end: character.end }); }}
      onLongPress={(event) => { event?.stopPropagation(); onCharacterLongPress?.({ start: character.start, end: character.end }); }} delayLongPress={450}>
      <Text style={[style, { flexShrink: 0 }, selected && styles.selected]}>{character.text}</Text>
      {selected && <View pointerEvents="none" testID="selection-character-outline" style={[styles.outline, character.start === selectedRange?.start && styles.start, character.end === selectedRange?.end && styles.end]} />}
    </Pressable>;
  })}</View>;
}
const styles = StyleSheet.create({
  surface: { position: 'relative', width: '100%', maxWidth: '100%', minWidth: 0, minHeight: 44, alignSelf: 'stretch', justifyContent: 'center' },
  withHandles: { paddingBottom: 34 },
  characters: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', maxWidth: '100%', minWidth: 0, flexShrink: 1 },
  selected: { textDecorationLine: 'underline', textDecorationColor: '#2261CF' },
  outline: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderTopWidth: 2, borderBottomWidth: 3, borderColor: '#2261CF' },
  start: { borderLeftWidth: 2 }, end: { borderRightWidth: 2 },
});
