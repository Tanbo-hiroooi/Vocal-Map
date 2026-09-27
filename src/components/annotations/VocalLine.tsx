import { Button } from '@/components/common/Button';
import { colors } from '@/constants/theme';
import { Annotation, LyricLine, SymbolDefinition, TextRange } from '@/domain/models';
import { createLyricSegments, LyricSegment } from '@/domain/services/lyrics';
import { LyricSegmentText, LyricSelectionSurface } from './LyricSelectionSurface';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const marker = (a: Annotation, symbols: SymbolDefinition[]) => a.highlight ? `${a.highlight.label}の色分け` : a.customText || symbols.find((s) => s.id === a.symbolId)?.symbol || '？';
const markerColor = (a: Annotation, symbols: SymbolDefinition[]) => a.colorOverride || symbols.find((s) => s.id === a.symbolId)?.color || colors.muted;
type AnnotationInteraction = { onAnnotationPress?(annotation: Annotation): void };
type LyricInteraction = AnnotationInteraction & { selectedRange?: TextRange; onCharacterPress?(range: TextRange): void };
function Markers({ items, symbols, fontSize, reserveSpace = false, onAnnotationPress }: { items: Annotation[]; symbols: SymbolDefinition[]; fontSize: number; reserveSpace?: boolean } & AnnotationInteraction) {
  if (!items.length && !reserveSpace) return null;
  const markerFontSize = Math.max(12, fontSize * .66);
  return <View testID={reserveSpace ? 'range-marker-lane' : undefined} style={[styles.markers, reserveSpace && { height: markerFontSize * 1.45 }]}>{items.map((a) => {
    const definition = symbols.find((symbol) => symbol.id === a.symbolId);
    return <Text accessibilityRole={onAnnotationPress ? 'button' : undefined} onPress={onAnnotationPress ? (event) => { event?.stopPropagation(); onAnnotationPress(a); } : undefined} accessibilityLabel={`${definition?.name ?? '記号'}${a.status === 'needs-review' ? '、要確認' : ''}${onAnnotationPress ? 'を編集' : ''}`} numberOfLines={1} key={a.id} style={[styles.marker, { color: markerColor(a, symbols), fontSize: markerFontSize, lineHeight: markerFontSize * 1.25 }]}>{marker(a, symbols)}{a.status === 'needs-review' ? ' ⚠' : ''}</Text>;
  })}</View>;
}

function BoundaryMarkers({ items, symbols, fontSize, reserveAbove, onAnnotationPress }: { items: Annotation[]; symbols: SymbolDefinition[]; fontSize: number; reserveAbove: boolean } & AnnotationInteraction) {
  if (!items.length) return null;
  const aboveLaneHeight = Math.max(12, fontSize * .66) * 1.45;
  const boundaryFontSize = Math.max(15, fontSize * .76);
  return <View testID="boundary-marker" style={styles.boundarySegment}>
    {reserveAbove && <View style={{ height: aboveLaneHeight }} />}
    <View style={[styles.boundaryMarkers, { minHeight: fontSize * 1.45 }]}>{items.map((annotation) => {
      const definition = symbols.find((symbol) => symbol.id === annotation.symbolId);
      return <Text accessibilityRole={onAnnotationPress ? 'button' : undefined} onPress={onAnnotationPress ? (event) => { event?.stopPropagation(); onAnnotationPress(annotation); } : undefined} accessibilityLabel={`${definition?.name ?? '記号'}、文字の間${annotation.status === 'needs-review' ? '、要確認' : ''}${onAnnotationPress ? 'を編集' : ''}`} numberOfLines={1} key={annotation.id} style={[styles.boundaryMarker, { color: markerColor(annotation, symbols), fontSize: boundaryFontSize, lineHeight: fontSize * 1.45 }]}>{marker(annotation, symbols)}{annotation.status === 'needs-review' ? ' ⚠' : ''}</Text>;
    })}</View>
  </View>;
}

function LyricSegmentView({ segment, index, symbols, fontSize, hasRangeMarkers, selectedRange, onCharacterPress, onAnnotationPress, highlightAnnotation }: { segment: LyricSegment; index: number; symbols: SymbolDefinition[]; fontSize: number; hasRangeMarkers: boolean; highlightAnnotation?: Annotation } & LyricInteraction) {
  const [labelHeight, setLabelHeight] = useState(15);
  return <View testID={`lyric-segment-${index}`} style={[styles.segment, segment.highlightLabel && { marginBottom: labelHeight }]}>
    {hasRangeMarkers && <Markers items={segment.annotations} symbols={symbols} fontSize={fontSize} reserveSpace onAnnotationPress={onAnnotationPress} />}
    <LyricSegmentText text={segment.text} start={segment.start} selectedRange={selectedRange} onCharacterPress={onCharacterPress} style={[styles.lyric, { fontSize, lineHeight: fontSize * 1.45 }, segment.highlight && { backgroundColor: segment.highlight.color }]} />
    {/* 説明は歌詞の幅に収め、短いセグメントの字間を押し広げない。 */}
    {segment.highlightLabel && <Text testID="highlight-label" accessibilityRole={onAnnotationPress ? 'button' : undefined} onPress={onAnnotationPress && highlightAnnotation ? (event) => { event?.stopPropagation(); onAnnotationPress(highlightAnnotation); } : undefined} accessibilityLabel={`${segment.highlightLabel.label}${onAnnotationPress ? 'の色分けを編集' : ''}`} numberOfLines={2} onLayout={(event) => setLabelHeight(event.nativeEvent.layout.height)} style={highlightLabelStyle}>{segment.highlightLabel.label}</Text>}
  </View>;
}

export function VocalLine({ line, symbols, fontSize = 20, editing, onAdd, onDelete, onPress, onRangeSelect, selectedRange, onCharacterPress, onAnnotationPress }: { line: LyricLine; symbols: SymbolDefinition[]; fontSize?: number; editing: boolean; onAdd?(): void; onDelete?(id: string): void; onPress?(): void; onRangeSelect?(range: TextRange): void } & LyricInteraction) {
  const segments = createLyricSegments(line.text, line.annotations);
  const lineItems = line.annotations.filter((a) => a.targetType === 'line');
  const hasRangeMarkers = segments.some((segment) => segment.annotations.length > 0);
  const lyricContent = <View testID="lyric-segments" style={styles.segments}>
    {segments.length ? segments.map((segment, i) => {
      return <React.Fragment key={`${segment.start}-${segment.end}-${i}`}>
        <BoundaryMarkers items={segment.boundaryAnnotations} symbols={symbols} fontSize={fontSize} reserveAbove={hasRangeMarkers} onAnnotationPress={onAnnotationPress} />
        {!!segment.text && <LyricSegmentView segment={segment} index={i} symbols={symbols} fontSize={fontSize} hasRangeMarkers={hasRangeMarkers} selectedRange={selectedRange} onCharacterPress={onCharacterPress} onAnnotationPress={onAnnotationPress} highlightAnnotation={line.annotations.find((a) => a.highlight && a.range?.start === segment.start && a.status === 'valid')} />}
      </React.Fragment>;
    }) : <Text style={[styles.lyric, { fontSize }]}>　</Text>}
  </View>;
  const content = <>
    <Markers items={lineItems} symbols={symbols} fontSize={fontSize} onAnnotationPress={onAnnotationPress} />
    {onPress ? <LyricSelectionSurface accessibilityLabel={line.text ? `歌詞「${line.text}」を選択` : '空行を選択'} textLength={line.text.length} onPress={onPress} onRangeSelect={onRangeSelect} onCharacterPress={onCharacterPress}>{lyricContent}</LyricSelectionSurface> : lyricContent}
    {line.annotations.filter((a) => a.highlight && a.status === 'needs-review').map((a) => <Text key={`highlight-${a.id}`} accessibilityRole={onAnnotationPress ? 'button' : undefined} onPress={onAnnotationPress ? () => onAnnotationPress(a) : undefined} style={styles.memo}>{a.highlight!.label} ⚠ 要確認（位置を選び直してください）</Text>)}
    {line.annotations.filter((a) => a.memo).map((a) => <Text key={`memo-${a.id}`} style={styles.memo}>・{a.memo}</Text>)}
  </>;
  return <View testID="vocal-line" style={[styles.container, !line.text && styles.blank]}>
    {content}
    {editing && <View style={styles.editRow}><Button label="＋ 記号追加" variant="secondary" onPress={() => onAdd?.()} />{line.annotations.map((a) => <Button key={a.id} label={`${marker(a, symbols)}を削除`} variant="ghost" onPress={() => onDelete?.(a.id)} />)}</View>}
  </View>;
}
const highlightLabelStyle = StyleSheet.create({ label: { position: 'absolute', top: '100%', left: 0, right: 0, color: colors.muted, fontSize: 11, lineHeight: 15, userSelect: 'none' } }).label;
const styles = StyleSheet.create({ container: { width: '100%', minWidth: 0, paddingHorizontal: 2, paddingVertical: 4, gap: 4 }, blank: { minHeight: 44 }, segments: { width: '100%', maxWidth: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', minWidth: 0 }, segment: { maxWidth: '100%', minWidth: 0, flexShrink: 1, justifyContent: 'flex-end' }, lyric: { maxWidth: '100%', minWidth: 0, color: colors.text, fontWeight: '600', flexShrink: 1 }, markers: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'flex-end', gap: 5, minHeight: 15, overflow: 'hidden', userSelect: 'none' }, marker: { fontWeight: '900', flexShrink: 1 }, boundarySegment: { flexShrink: 0, justifyContent: 'flex-end' }, boundaryMarkers: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }, boundaryMarker: { fontWeight: '900', textAlign: 'center' }, memo: { color: colors.muted, fontSize: 13 }, editRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9, paddingTop: 9, borderTopWidth: 1, borderTopColor: colors.border } });
