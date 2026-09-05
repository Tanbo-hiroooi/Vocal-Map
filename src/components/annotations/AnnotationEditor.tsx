import { Button } from '@/components/common/Button';
import { ChoiceChips } from '@/components/common/ChoiceChips';
import { FormField } from '@/components/common/FormField';
import { colors } from '@/constants/theme';
import { Annotation, LyricLine, SymbolDefinition, TextRange } from '@/domain/models';
import { createTextBoundary, findTextRanges, hasOverlappingRange } from '@/domain/services/lyrics';
import { createId, nowIso } from '@/utils/id';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const annotationMarker = (annotation: Annotation, symbols: SymbolDefinition[]) => annotation.customText || symbols.find((symbol) => symbol.id === annotation.symbolId)?.symbol || '？';
type TargetType = Annotation['targetType'];

export function AnnotationEditor({ visible, line, symbols, initialRange, onClose, onSave, onDelete }: { visible: boolean; line: LyricLine; symbols: SymbolDefinition[]; initialRange?: TextRange; onClose(): void; onSave(annotation: Annotation): void; onDelete?(id: string): void }) {
  const [symbolId, setSymbolId] = useState(symbols.find((symbol) => symbol.isFavorite)?.id ?? symbols[0]?.id ?? '');
  const [targetType, setTargetType] = useState<TargetType>(initialRange || line.text ? 'range' : 'line');
  const [query, setQuery] = useState(initialRange ? line.text.slice(initialRange.start, initialRange.end) : '');
  const [occurrence, setOccurrence] = useState(0);
  const [selectedRange, setSelectedRange] = useState<TextRange | undefined>(initialRange);
  const [selectionAnchor, setSelectionAnchor] = useState<TextRange>();
  const [boundaryIndex, setBoundaryIndex] = useState<number | undefined>(initialRange?.end);
  const [memo, setMemo] = useState('');
  const [customText, setCustomText] = useState('');
  const [error, setError] = useState('');
  const ranges = useMemo(() => findTextRanges(line.text, query), [line.text, query]);
  const resolvedRange = selectedRange ?? ranges[occurrence];
  const characters = useMemo(() => {
    let offset = 0;
    return Array.from(line.text).map((value) => {
      const character = { value, start: offset, end: offset + value.length };
      offset = character.end;
      return character;
    });
  }, [line.text]);
  const boundaryChoices = useMemo(() => characters.length ? characters.map((character, index) => ({
    index: character.end,
    label: `${character.value === ' ' ? '空白' : character.value}｜${characters[index + 1]?.value === ' ' ? '空白' : characters[index + 1]?.value ?? '末尾'}`,
    accessibilityLabel: characters[index + 1]
      ? `「${character.value === ' ' ? '空白' : character.value}」と「${characters[index + 1].value === ' ' ? '空白' : characters[index + 1].value}」の間`
      : `「${character.value === ' ' ? '空白' : character.value}」の後、行末`,
  })) : [], [characters]);

  const selectCharacter = (character: TextRange) => {
    const range = selectionAnchor
      ? { start: Math.min(selectionAnchor.start, character.start), end: Math.max(selectionAnchor.end, character.end) }
      : character;
    setSelectionAnchor(selectionAnchor ? undefined : character);
    setSelectedRange(range);
    setTargetType('range');
    setQuery(line.text.slice(range.start, range.end));
    setOccurrence(0);
    setError('');
  };

  const resetSelection = () => {
    setSelectedRange(undefined);
    setSelectionAnchor(undefined);
    setQuery('');
    setOccurrence(0);
    setError('');
  };

  const save = () => {
    setError('');
    if (!symbolId && !customText.trim()) {
      setError('記号を選択するか、自由記述を入力してください。');
      return;
    }
    const range = targetType === 'range' ? resolvedRange : undefined;
    const boundary = targetType === 'boundary' && boundaryIndex !== undefined ? createTextBoundary(line.text, boundaryIndex) : undefined;
    if (targetType === 'range' && !range) {
      setError('記号を付ける語句を選択してください。');
      return;
    }
    if (targetType === 'boundary' && !boundary) {
      setError('記号を置く文字と文字の間を選択してください。');
      return;
    }
    if (range && hasOverlappingRange(line.annotations, range)) {
      setError('この範囲は別の記号と重なっています。重ならない範囲を選択してください。');
      return;
    }
    const date = nowIso();
    onSave({
      id: createId(), symbolId, position: targetType === 'boundary' ? 'inline' : 'above', targetType, range, boundary,
      targetTextSnapshot: range ? line.text.slice(range.start, range.end) : undefined,
      customText: customText.trim() || undefined, memo: memo.trim() || undefined,
      status: 'valid', createdAt: date, updatedAt: date,
    });
    onClose();
  };

  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.title}>歌詞に記号を追加</Text><Text style={styles.subtitle}>文字の上・文字の間・行全体から配置を選べます</Text></View><Button label="閉じる" variant="ghost" onPress={onClose} /></View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <View style={styles.step}><Text style={styles.stepNumber}>1</Text><Text style={styles.stepTitle}>記号を付ける場所を選ぶ</Text></View>
        <ChoiceChips value={targetType} onChange={(value) => { setTargetType(value); setError(''); }} options={line.text ? [{ value: 'range', label: '文字・語句の上' }, { value: 'boundary', label: '文字の間（ブレス）' }, { value: 'line', label: '行全体' }] : [{ value: 'line', label: '行全体' }]} />
        {targetType === 'range' && <>
          <Text style={styles.hint}>{initialRange ? '歌詞画面で選択した範囲です。必要なら先頭文字と末尾文字をタップして選び直せます。' : '対象語句の先頭文字をタップし、次に末尾文字をタップしてください。1文字だけなら同じ文字を続けてタップします。'}</Text>
          {characters.length > 0 ? <View accessibilityLabel="記号を付ける歌詞の範囲を選択" style={styles.characterPicker}>{characters.map((character, index) => {
            const selected = !!resolvedRange && character.start < resolvedRange.end && resolvedRange.start < character.end;
            return <Pressable accessibilityRole="button" accessibilityLabel={`${index + 1}文字目「${character.value === ' ' ? '空白' : character.value}」`} key={`${character.start}-${character.value}`} onPress={() => selectCharacter(character)} style={[styles.character, selected && styles.characterSelected]}><Text style={[styles.characterText, selected && styles.characterTextSelected]}>{character.value === ' ' ? '␣' : character.value}</Text></Pressable>;
          })}</View> : <Text style={styles.waiting}>空行には「行全体」で記号を付けられます。</Text>}
          {resolvedRange ? <View style={styles.selectionSummary}><Text style={styles.preview}>{selectionAnchor ? '先頭を選択しました。末尾をタップ：' : '選択中：'}『{line.text.slice(resolvedRange.start, resolvedRange.end)}』</Text><Button label="選び直す" variant="ghost" onPress={resetSelection} /></View> : <Text style={styles.waiting}>歌詞の中から対象語句を選択してください。</Text>}
          <FormField label="または対象語句を入力" value={query} onChangeText={(value) => { setQuery(value); setSelectedRange(undefined); setSelectionAnchor(undefined); setOccurrence(0); }} placeholder="選択しにくい場合はこちらへ入力" />
          {!selectedRange && ranges.length > 1 && <><Text style={styles.label}>同じ語句が{ranges.length}個あります</Text><ChoiceChips value={String(occurrence)} onChange={(value) => setOccurrence(Number(value))} options={ranges.map((_, index) => ({ value: String(index), label: `${index + 1}番目` }))} /></>}
          {query && !resolvedRange && <Text style={styles.error}>対象語句が見つかりません。</Text>}
        </>}
        {targetType === 'boundary' && <>
          <Text style={styles.hint}>ブレスなど、言葉と言葉の間に置く記号です。「｜」が実際に記号を置く位置を表します。</Text>
          <View accessibilityLabel="記号を置く文字と文字の間を選択" style={styles.boundaryPicker}>{boundaryChoices.map((choice) => <Pressable accessibilityRole="radio" accessibilityLabel={choice.accessibilityLabel} accessibilityState={{ checked: boundaryIndex === choice.index }} key={choice.index} onPress={() => { setBoundaryIndex(choice.index); setError(''); }} style={[styles.boundaryChoice, boundaryIndex === choice.index && styles.boundaryChoiceSelected]}><Text style={[styles.boundaryChoiceText, boundaryIndex === choice.index && styles.boundaryChoiceTextSelected]}>{choice.label}</Text></Pressable>)}</View>
          {boundaryIndex === undefined ? <Text style={styles.waiting}>「｜」の位置を1つ選択してください。</Text> : <Text style={styles.preview}>選択中：{boundaryChoices.find((choice) => choice.index === boundaryIndex)?.accessibilityLabel}</Text>}
        </>}
        {targetType === 'line' && <Text style={styles.preview}>この行全体に記号を付けます。</Text>}

        <View style={styles.step}><Text style={styles.stepNumber}>2</Text><Text style={styles.stepTitle}>記号を選ぶ</Text></View>
        <Text style={styles.hint}>「伸ばす」「短く切る」など、歌い方が分かる名前から選べます。</Text>
        <View style={styles.symbols}>{symbols.map((symbol) => <Pressable accessibilityRole="radio" accessibilityLabel={`${symbol.name}、${symbol.meaning}`} accessibilityState={{ checked: symbolId === symbol.id }} key={symbol.id} onPress={() => setSymbolId(symbol.id)} style={[styles.symbol, symbolId === symbol.id && styles.selected]}><Text style={[styles.symbolText, { color: symbol.color }]}>{symbol.symbol}</Text><Text numberOfLines={2} style={styles.symbolName}>{symbol.name}</Text></Pressable>)}</View>
        <FormField label="自由記述（任意）" value={customText} onChangeText={setCustomText} placeholder="例：ここだけ語尾を軽く" hint="選んだ記号の代わり、または補足として表示します。" />
        <FormField label="補足メモ" value={memo} onChangeText={setMemo} placeholder="歌い方の詳細（任意）" multiline />
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Button label="この記号を追加" onPress={save} />

        {line.annotations.length > 0 && onDelete && <View style={styles.existing}><Text style={styles.label}>この行に付いている記号</Text><View style={styles.existingButtons}>{line.annotations.map((annotation) => <Button key={annotation.id} label={`${annotationMarker(annotation, symbols)}を削除`} variant="danger" onPress={() => onDelete(annotation.id)} />)}</View></View>}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerCopy: { flex: 1, minWidth: 0, paddingRight: 8 },
  title: { fontSize: 20, fontWeight: '900', color: colors.text },
  subtitle: { marginTop: 2, fontSize: 12, color: colors.muted },
  body: { padding: 16, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  stepNumber: { width: 27, height: 27, borderRadius: 14, textAlign: 'center', lineHeight: 27, backgroundColor: colors.primary, color: '#fff', fontWeight: '900' },
  stepTitle: { fontSize: 17, fontWeight: '900', color: colors.text },
  hint: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  characterPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary, borderRadius: 12, padding: 10 },
  character: { width: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  characterSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  characterText: { color: colors.text, fontSize: 20, fontWeight: '700' },
  characterTextSelected: { color: '#fff' },
  boundaryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, backgroundColor: '#EAF8F1', borderRadius: 12, padding: 10 },
  boundaryChoice: { minHeight: 44, minWidth: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10 },
  boundaryChoiceSelected: { backgroundColor: colors.success, borderColor: colors.success },
  boundaryChoiceText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  boundaryChoiceTextSelected: { color: '#fff' },
  selectionSummary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, backgroundColor: '#EAF8F1', borderRadius: 8, paddingLeft: 10 },
  preview: { flex: 1, minWidth: 180, color: colors.success, paddingVertical: 10, fontWeight: '700' },
  waiting: { color: colors.muted, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 10, borderRadius: 8 },
  label: { fontSize: 15, fontWeight: '700', color: colors.text },
  symbols: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symbol: { width: 92, minHeight: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, padding: 6 },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft, borderWidth: 2 },
  symbolText: { fontSize: 22, fontWeight: '800' },
  symbolName: { fontSize: 10, color: colors.muted, marginTop: 4, textAlign: 'center', lineHeight: 13 },
  error: { color: colors.danger, fontSize: 13 },
  existing: { marginTop: 8, paddingTop: 16, gap: 10, borderTopWidth: 1, borderTopColor: colors.border },
  existingButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
