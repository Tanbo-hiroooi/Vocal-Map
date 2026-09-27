import { Button } from '@/components/common/Button';
import { ChoiceChips } from '@/components/common/ChoiceChips';
import { FormField } from '@/components/common/FormField';
import { colors } from '@/constants/theme';
import { Annotation, LyricLine, SymbolDefinition, TextRange } from '@/domain/models';
import { AnnotationContent, AnnotationTarget, makeQuickAnnotation } from '@/domain/services/quickAnnotation';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HighlightPicker } from './HighlightPicker';

type Props = { line: LyricLine; range?: TextRange; awaitingEnd: boolean; awaitingRange?: boolean; annotation?: Annotation; symbols: SymbolDefinition[];
  onSave(annotation: Annotation): Promise<void>; onDelete(id: string): Promise<void>;
  onClose(): void; onReselect(): void; onSelectLine(): void };
const colorPresets = [{ label: '裏声', color: '#E9E3FF' }, { label: 'ミックス', color: '#DCF3E9' }, { label: '地声', color: '#FFE7A0' }];

export function QuickAnnotationToolbar({ line, range, awaitingEnd, awaitingRange, annotation, symbols, onSave, onDelete, onClose, onReselect, onSelectLine }: Props) {
  const [mode, setMode] = useState<'symbol' | 'highlight' | 'breath'>(annotation?.highlight ? 'highlight' : annotation?.targetType === 'boundary' ? 'breath' : 'symbol');
  const [more, setMore] = useState(false);
  const [side, setSide] = useState<'before' | 'after'>('after');
  const [highlight, setHighlight] = useState(annotation?.highlight ?? colorPresets[0]);
  const [customText, setCustomText] = useState(annotation?.customText ?? '');
  const [memo, setMemo] = useState(annotation?.memo ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const run = async (action: () => Promise<void>) => {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : '保存できませんでした。もう一度お試しください。'); }
    finally { saving.current = false; setBusy(false); }
  };
  const target = (): AnnotationTarget => {
    if (awaitingRange) throw new Error('歌詞上で先頭と末尾の文字を選んでください。');
    if (mode === 'breath') {
      if (!range && annotation?.targetType === 'boundary' && annotation.boundary && annotation.status === 'valid') return { type: 'boundary', index: annotation.boundary.index };
      if (!range) throw new Error('ブレスの前後にある文字をタップしてください。');
      return { type: 'boundary', index: side === 'after' ? range.end : range.start };
    }
    if (mode === 'highlight' && !range) throw new Error('色分けする語句を歌詞上で選んでください。');
    return range ? { type: 'range', range } : { type: 'line' };
  };
  const apply = (content: AnnotationContent) => void run(() => {
    const destination = target();
    const sameKind = annotation && !!annotation.highlight === !!content.highlight && (annotation.targetType === 'boundary') === (destination.type === 'boundary');
    return onSave(makeQuickAnnotation(line, destination, content, sameKind ? annotation.id : undefined));
  });
  const ordered = [...symbols].filter((s) => mode !== 'breath' || s.category === 'breath').sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.order - b.order);
  const visibleSymbols = more ? ordered : ordered.slice(0, 6);
  const description = awaitingRange ? '歌詞上で文字を選択' : range ? `「${line.text.slice(range.start, range.end)}」` : annotation?.targetType === 'boundary' ? '文字の間' : '行全体';
  return <View testID="quick-annotation-toolbar" style={styles.toolbar}>
    <View style={styles.header}><Text numberOfLines={2} style={styles.target}>{description}{annotation ? 'を変更' : ''}</Text><Button label="閉じる" variant="ghost" onPress={onClose} /></View>
    {awaitingEnd && <Text style={styles.hint}>末尾の文字をタップして範囲を広げられます。1文字だけなら、このまま選べます。</Text>}
    <ChoiceChips value={mode} onChange={(value) => { setMode(value); setMore(false); setError(''); }} options={[{ value: 'symbol', label: '記号' }, { value: 'highlight', label: '色分け' }, { value: 'breath', label: 'ブレス' }]} />
    {mode === 'breath' && (annotation?.targetType !== 'boundary' || range) && <ChoiceChips value={side} onChange={setSide} options={[{ value: 'after', label: '選んだ文字の後' }, { value: 'before', label: '選んだ文字の前' }]} />}
    <View style={styles.choices}>
      {mode === 'highlight' ? colorPresets.map((preset) => <Pressable key={preset.label} accessibilityRole="button" accessibilityLabel={`${preset.label}で色分け`} disabled={busy} onPress={() => { setHighlight(preset); apply({ symbolId: '', highlight: preset, memo }); }} style={[styles.choice, { backgroundColor: preset.color }]}><Text style={styles.name}>{preset.label}</Text></Pressable>) : visibleSymbols.map((symbol) => <Pressable key={symbol.id} accessibilityRole="button" accessibilityLabel={`${symbol.name}を付ける`} disabled={busy} onPress={() => { setCustomText(''); apply({ symbolId: symbol.id, memo }); }} style={styles.choice}><Text style={[styles.symbol, { color: symbol.color ?? colors.text }]}>{symbol.symbol}</Text><Text numberOfLines={2} style={styles.name}>{symbol.name}</Text></Pressable>)}
    </View>
    {mode !== 'highlight' && !ordered.length && <Text style={styles.hint}>記号辞書に記号を登録するか、「もっと見る」から自由記述を入力してください。</Text>}
    <View style={styles.actions}>
      <Button label={more ? '少なく表示' : 'もっと見る'} style={styles.compactButton} variant="ghost" onPress={() => setMore(!more)} />
      <Button label="範囲選択" accessibilityLabel="範囲を選び直す" style={styles.compactButton} variant="ghost" onPress={onReselect} />
      {!annotation && <Button label="行全体" style={styles.compactButton} variant="ghost" onPress={onSelectLine} />}
      {annotation && <Button label="削除" style={styles.compactButton} accessibilityLabel="選択した記号・色分けを削除" variant="danger" disabled={busy} onPress={() => void run(() => onDelete(annotation.id))} />}
    </View>
    {more && <View style={styles.details}>
      {mode === 'highlight' ? <HighlightPicker value={highlight} onChange={setHighlight} /> : <FormField label="自由記述" value={customText} onChangeText={setCustomText} placeholder="例：語尾を軽く" />}
      <FormField label="補足メモ" value={memo} onChangeText={setMemo} multiline />
      <Button label="この内容を反映" loading={busy} onPress={() => apply(mode === 'highlight' ? { symbolId: '', highlight, memo } : { symbolId: customText.trim() ? '' : annotation?.symbolId ?? '', customText: customText.trim() || undefined, memo, colorOverride: annotation?.colorOverride })} />
    </View>}
    {busy && <Text accessibilityLiveRegion="polite" style={styles.hint}>保存中…</Text>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  toolbar: { width: '100%', maxWidth: 560, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primaryBorder, borderRadius: 16, padding: 10, gap: 8, marginTop: 6, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4 }, target: { flex: 1, color: colors.text, fontWeight: '800', fontSize: 14 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, choice: { minHeight: 44, flexGrow: 1, flexBasis: 76, maxWidth: 156, padding: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.primarySoft },
  symbol: { fontSize: 22, fontWeight: '800' }, name: { fontSize: 12, color: colors.text, textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap' }, compactButton: { paddingHorizontal: 8, paddingVertical: 6 }, details: { gap: 10 }, hint: { color: colors.muted, fontSize: 12, lineHeight: 17 }, error: { color: colors.danger, fontSize: 13 },
});
