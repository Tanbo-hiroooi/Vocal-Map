import { QuickAnnotationToolbar } from '@/components/annotations/QuickAnnotationToolbar';
import { VocalLine } from '@/components/annotations/VocalLine';
import { Button } from '@/components/common/Button';
import { confirmAction } from '@/components/common/confirmationDialog';
import { Screen } from '@/components/common/Screen';
import { colors } from '@/constants/theme';
import { Annotation, LyricLine, TextRange } from '@/domain/models';
import { useAppData } from '@/features/app/AppProvider';
import { nowIso } from '@/utils/id';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export default function MapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { songs, symbols, settings, saveSong, saveSettings, loading } = useAppData();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const song = songs.find((item) => item.id === id);
  const [selection, setSelection] = useState<{ lineId: string; range?: TextRange; anchor?: TextRange; annotationId?: string; picking?: boolean; revision: number }>();
  const annotationSaving = useRef(false);
  const active = song?.lyrics.find((line) => line.id === selection?.lineId);
  const [fontSize, setFontSize] = useState(settings.practiceFontSize);
  const [lineSpacing, setLineSpacing] = useState(settings.lyricLineSpacing);
  const displayValues = useRef({ fontSize: settings.practiceFontSize, lineSpacing: settings.lyricLineSpacing });
  const displaySaveVersion = useRef(0);
  const [displayError, setDisplayError] = useState('');
  const settingsLoaded = useRef(false);
  useEffect(() => {
    if (loading || settingsLoaded.current) return;
    setFontSize(settings.practiceFontSize);
    setLineSpacing(settings.lyricLineSpacing);
    displayValues.current = { fontSize: settings.practiceFontSize, lineSpacing: settings.lyricLineSpacing };
    settingsLoaded.current = true;
  }, [loading, settings.lyricLineSpacing, settings.practiceFontSize]);

  if (loading) return <Screen><Text>読み込み中…</Text></Screen>;
  if (!song) return <Screen><Text accessibilityRole="alert">曲が見つかりません。削除された可能性があります。</Text><Button label="曲一覧へ" onPress={() => router.replace('/')} /></Screen>;

  const responsiveFontSize = Math.min(fontSize, width < 380 ? 30 : 38);
  const changeDisplay = (field: 'fontSize' | 'lineSpacing', delta: number) => {
    const current = displayValues.current;
    const next = { ...current, [field]: field === 'fontSize'
      ? Math.max(20, Math.min(42, current.fontSize + delta))
      : Math.max(0, Math.min(24, current.lineSpacing + delta)) };
    displayValues.current = next;
    setFontSize(next.fontSize);
    setLineSpacing(next.lineSpacing);
    setDisplayError('');
    const version = ++displaySaveVersion.current;
    void saveSettings({ ...settings, practiceFontSize: next.fontSize, lyricLineSpacing: next.lineSpacing }).catch(() => {
      if (version === displaySaveVersion.current) setDisplayError('文字サイズ・行間を保存できませんでした。もう一度変更してお試しください。');
    });
  };
  const closeEditor = () => { Keyboard.dismiss(); setSelection(undefined); };
  const openEditor = (line: LyricLine, range?: TextRange) => {
    Keyboard.dismiss();
    setSelection((previous) => ({ lineId: line.id, range, revision: (previous?.revision ?? 0) + 1 }));
  };
  const editAnnotation = (line: LyricLine, annotation: Annotation) => {
    Keyboard.dismiss();
    setSelection((previous) => ({ lineId: line.id, range: annotation.status === 'valid' ? annotation.range : undefined, annotationId: annotation.id, picking: annotation.status === 'needs-review', revision: (previous?.revision ?? 0) + 1 }));
  };
  const selectCharacter = (line: LyricLine, character: TextRange) => {
    setSelection((previous) => {
      const current = previous?.lineId === line.id ? previous : undefined;
      const anchor = current?.anchor;
      return { lineId: line.id, range: anchor ? { start: Math.min(anchor.start, character.start), end: Math.max(anchor.end, character.end) } : character,
        anchor: anchor ? undefined : character, picking: !anchor, annotationId: current?.picking ? current.annotationId : undefined, revision: (previous?.revision ?? 0) + 1 };
    });
  };
  const updateLine = async (lineId: string, annotations: LyricLine['annotations']) => {
    if (annotationSaving.current) throw new Error('保存中です。少し待ってからもう一度お試しください。');
    annotationSaving.current = true;
    try { await saveSong({ ...song, lyrics: song.lyrics.map((line) => line.id === lineId ? { ...line, annotations } : line), updatedAt: nowIso() }); }
    catch { throw new Error('保存できませんでした。もう一度お試しください。'); }
    finally { annotationSaving.current = false; }
  };
  const saveAnnotation = async (line: LyricLine, annotation: Annotation) => {
    const revision = selection?.revision;
    await updateLine(line.id, [...line.annotations.filter((a) => a.id !== annotation.id), annotation]);
    setSelection((current) => current?.lineId === line.id && current.revision === revision ? { ...current, annotationId: annotation.id, anchor: undefined, picking: false } : current);
  };
  const remove = async (line: LyricLine, annotationId: string) => {
    const label = line.annotations.find((a) => a.id === annotationId)?.highlight ? '色分け' : '記号';
    if (!await confirmAction(`${label}を削除しますか？`, `この歌詞行から${label}を外します。`, '削除', true)) return;
    await updateLine(line.id, line.annotations.filter((annotation) => annotation.id !== annotationId));
    setSelection((current) => current?.annotationId === annotationId ? undefined : current);
  };

  return <Screen scroll={false} contentStyle={styles.screen}>
    <View testID="map-workspace" style={styles.workspace}>
    <ScrollView testID="map-lyrics-scroll" style={styles.lyricScroll} contentContainerStyle={styles.lyricContent} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><View style={styles.heading}><Text style={styles.title}>{song.title}</Text><Text style={styles.artist}>{song.artist || 'アーティスト未設定'}</Text></View><View style={styles.headerActions}><Button label="← 曲一覧へ" variant="ghost" onPress={() => router.dismissTo('/')} accessibilityLabel="曲一覧へ戻る"/><Button label="曲情報を編集" variant="secondary" onPress={() => router.push(`/songs/${song.id}/edit`)} /></View></View>
    {song.memo && <Text style={styles.songMemo}>{song.memo}</Text>}
    <View style={styles.guide}><Text style={styles.guideTitle}>歌詞に直接、書き込もう</Text><Text style={styles.guideText}>先頭の文字をタップし、次に末尾の文字をタップすると編集欄が開きます。1文字だけなら同じ文字を2回タップ。選択中は青い線で表示します。PCはドラッグも使えます。付けた記号や色分けの名前をタップすると変更できます。</Text></View>
    <View style={styles.controls}>
      <View style={styles.controlGroup}><Text style={styles.controlLabel}>文字サイズ</Text><Button label="小さく" variant="ghost" onPress={() => changeDisplay('fontSize', -2)} accessibilityLabel="歌詞の文字を小さくする"/><Text testID="lyric-font-size" style={styles.size}>{fontSize}</Text><Button label="大きく" variant="ghost" onPress={() => changeDisplay('fontSize', 2)} accessibilityLabel="歌詞の文字を大きくする"/></View>
      <View style={styles.controlGroup}><Text style={styles.controlLabel}>行間</Text><Button label="狭く" variant="ghost" onPress={() => changeDisplay('lineSpacing', -2)} accessibilityLabel="歌詞の行間を狭くする"/><Text style={styles.size}>{lineSpacing}</Text><Button label="広く" variant="ghost" onPress={() => changeDisplay('lineSpacing', 2)} accessibilityLabel="歌詞の行間を広くする"/></View>
    </View>
    {!!displayError && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{displayError}</Text>}
    <View testID="lyric-lines" style={[styles.lines, { gap: lineSpacing }]}>{song.lyrics.map((line) => <View key={line.id} testID={`lyric-line-${line.id}`} style={[styles.lineTarget, active?.id === line.id && styles.activeLine]}>
      <VocalLine line={line} symbols={symbols} fontSize={responsiveFontSize} editing={false} selectedRange={active?.id === line.id ? selection?.range : undefined} onPress={() => { if (!line.text) openEditor(line); }} onRangeSelect={(range) => openEditor(line, range)} onCharacterPress={(range) => selectCharacter(line, range)} onAnnotationPress={(annotation) => editAnnotation(line, annotation)} />
      {active?.id === line.id && selection && (selection.anchor || (selection.picking && !selection.range) ? <View testID="selection-prompt" style={styles.selectionPrompt}><Text accessibilityLiveRegion="polite" style={styles.guideText}>{selection.anchor ? `「${line.text.slice(selection.anchor.start, selection.anchor.end)}」から選択中。末尾の文字をタップしてください（同じ文字なら1文字を選択）。` : '先頭の文字、末尾の文字の順にタップしてください。'}</Text><Button label="選択を取り消す" variant="ghost" onPress={closeEditor} /></View> : <QuickAnnotationToolbar key={`${line.id}:${selection.annotationId ?? 'new'}`} line={line} symbols={symbols} range={selection.range} awaitingEnd={false} annotation={line.annotations.find((a) => a.id === selection.annotationId)} onClose={closeEditor} onSave={(annotation) => saveAnnotation(line, annotation)} onDelete={(annotationId) => remove(line, annotationId)} onSelectLine={() => openEditor(line)} onReselect={() => setSelection((current) => current ? { ...current, range: undefined, anchor: undefined, picking: true, revision: current.revision + 1 } : current)} />)}
    </View>)}</View>
    </ScrollView>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 1200, padding: 0, gap: 0 },
  workspace: { flex: 1, minHeight: 0, minWidth: 0, width: '100%' },
  lyricScroll: { flex: 1, minHeight: 0, minWidth: 0 },
  lyricContent: { padding: 12, gap: 16, maxWidth: 760, width: '100%', alignSelf: 'center' },
  lineTarget: { borderLeftWidth: 3, borderLeftColor: 'transparent', paddingLeft: 4 },
  activeLine: { borderLeftColor: colors.primary },
  selectionPrompt: { gap: 4, alignItems: 'flex-start', paddingVertical: 4 },
  header: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  heading: { flex: 1, minWidth: 180 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  title: { fontSize: 28, fontWeight: '900', color: colors.text },
  artist: { color: colors.muted, marginTop: 4 },
  songMemo: { backgroundColor: colors.primarySoft, padding: 12, borderRadius: 12, color: colors.text },
  guide: { backgroundColor: colors.primarySoft, borderRadius: 14, padding: 13, gap: 4 },
  guideTitle: { color: colors.primary, fontWeight: '900' },
  guideText: { color: colors.text, fontSize: 13, lineHeight: 19 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 14, padding: 6 },
  controlGroup: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6 },
  controlLabel: { color: colors.muted, fontWeight: '700' },
  size: { fontWeight: '900', color: colors.primary, minWidth: 28, textAlign: 'center' },
  lines: { width: '100%' },
});
