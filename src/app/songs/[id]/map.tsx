import { QuickAnnotationToolbar } from '@/components/annotations/QuickAnnotationToolbar';
import { VocalLine } from '@/components/annotations/VocalLine';
import { Button } from '@/components/common/Button';
import { confirmAction } from '@/components/common/confirmationDialog';
import { Screen } from '@/components/common/Screen';
import { AutoScrollControls } from '@/components/songs/AutoScrollControls';
import { AutoScrollHeaderButton } from '@/components/songs/AutoScrollHeaderButton';
import { PracticeScrollArea } from '@/components/songs/PracticeScrollArea';
import { colors } from '@/constants/theme';
import { Annotation, LyricLine } from '@/domain/models';
import { changeEditorMode, editExistingAnnotation, EditorSelection, reselectHighlight, selectEditorCharacter, selectEditorRange } from '@/features/annotations/editorSelection';
import { useAppData } from '@/features/app/AppProvider';
import { useAutoScroll } from '@/features/songs/useAutoScroll';
import { usePracticeSettings } from '@/features/songs/usePracticeSettings';
import { nowIso } from '@/utils/id';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export default function MapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { songs, symbols, settings, saveSong, saveSettings, loading } = useAppData();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const song = songs.find((item) => item.id === id);
  const [selection, setSelection] = useState<EditorSelection>();
  const annotationSaving = useRef(false);
  const active = song?.lyrics.find((line) => line.id === selection?.lineId);
  const { fontSize, lineSpacing, autoScrollSpeed, error: displayError, change: changeDisplay } = usePracticeSettings(settings, loading, saveSettings);
  const lyricScroll = useRef<ScrollView>(null);
  const lyricsTop = useRef(0);
  const autoScroll = useAutoScroll(lyricScroll, autoScrollSpeed);
  const pauseAutoScroll = autoScroll.pause;
  const [autoScrollPanelVisible, setAutoScrollPanelVisible] = useState(false);
  useFocusEffect(useCallback(() => () => { pauseAutoScroll(); setAutoScrollPanelVisible(false); }, [pauseAutoScroll, setAutoScrollPanelVisible]));

  if (loading) return <Screen><Text>読み込み中…</Text></Screen>;
  if (!song) return <Screen><Text accessibilityRole="alert">曲が見つかりません。削除された可能性があります。</Text><Button label="曲一覧へ" onPress={() => router.replace('/')} /></Screen>;

  const responsiveFontSize = Math.min(fontSize, width < 380 ? 30 : 38);
  const closeEditor = () => { Keyboard.dismiss(); setSelection(undefined); };
  const openEditor = (line: LyricLine) => {
    autoScroll.pause();
    Keyboard.dismiss();
    setSelection((previous) => ({ lineId: line.id, mode: 'symbol', revision: (previous?.revision ?? 0) + 1 }));
  };
  const editAnnotation = (line: LyricLine, annotation: Annotation) => {
    autoScroll.pause();
    Keyboard.dismiss();
    setSelection((previous) => editExistingAnnotation(previous, line, annotation));
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
    setSelection((current) => current?.lineId === line.id && current.revision === revision ? { ...current, annotationId: annotation.id, anchor: undefined, pickingStart: false } : current);
  };
  const remove = async (line: LyricLine, annotationId: string) => {
    const label = line.annotations.find((a) => a.id === annotationId)?.highlight ? '色分け' : '記号';
    if (!await confirmAction(`${label}を削除しますか？`, `この歌詞行から${label}を外します。`, '削除', true)) return;
    await updateLine(line.id, line.annotations.filter((annotation) => annotation.id !== annotationId));
    setSelection((current) => current?.annotationId === annotationId ? undefined : current);
  };

  return <>
    <Stack.Screen options={{ headerTitleStyle: { fontWeight: '800', fontSize: 17 }, headerRight: () => <AutoScrollHeaderButton running={autoScroll.running} expanded={autoScrollPanelVisible} onOpen={() => { Keyboard.dismiss(); setAutoScrollPanelVisible(true); }} onPause={autoScroll.pause} /> }} />
    <Screen scroll={false} contentStyle={styles.screen}>
    <View testID="map-workspace" style={styles.workspace}>
    <PracticeScrollArea onInterrupt={autoScroll.pause}>
    <ScrollView ref={lyricScroll} testID="map-lyrics-scroll" style={styles.lyricScroll} contentContainerStyle={styles.lyricContent} keyboardShouldPersistTaps="handled" onScroll={autoScroll.onScroll} onLayout={autoScroll.onLayout} onContentSizeChange={autoScroll.onContentSizeChange} onScrollBeginDrag={autoScroll.pause} scrollEventThrottle={16}>
    <View style={styles.header}><View style={styles.heading}><Text style={styles.title}>{song.title}</Text><Text style={styles.artist}>{song.artist || 'アーティスト未設定'}</Text></View><View style={styles.headerActions}><Button label="← 曲一覧へ" variant="ghost" onPress={() => router.dismissTo('/')} accessibilityLabel="曲一覧へ戻る"/><Button label="曲情報を編集" variant="secondary" onPress={() => router.push(`/songs/${song.id}/edit`)} /></View></View>
    {song.memo && <Text style={styles.songMemo}>{song.memo}</Text>}
    <View style={styles.guide}><Text style={styles.guideTitle}>歌詞に直接、書き込もう</Text><Text style={styles.guideText}>文字をタップすると編集欄が開き、記号やブレスを付けられます。複数文字を色分けするときは「色分け」を選んでから、歌詞の末尾をタップしてください。PCは色分けの範囲をドラッグでも選べます。付けた記号や色分けの名前をタップすると変更できます。</Text></View>
    <View style={styles.controls}>
      <View style={styles.controlGroup}><Text style={styles.controlLabel}>文字サイズ</Text><Button label="小さく" variant="ghost" onPress={() => { autoScroll.pause(); changeDisplay('fontSize', -2); }} accessibilityLabel="歌詞の文字を小さくする"/><Text testID="lyric-font-size" style={styles.size}>{fontSize}</Text><Button label="大きく" variant="ghost" onPress={() => { autoScroll.pause(); changeDisplay('fontSize', 2); }} accessibilityLabel="歌詞の文字を大きくする"/></View>
      <View style={styles.controlGroup}><Text style={styles.controlLabel}>行間</Text><Button label="狭く" variant="ghost" onPress={() => { autoScroll.pause(); changeDisplay('lineSpacing', -2); }} accessibilityLabel="歌詞の行間を狭くする"/><Text style={styles.size}>{lineSpacing}</Text><Button label="広く" variant="ghost" onPress={() => { autoScroll.pause(); changeDisplay('lineSpacing', 2); }} accessibilityLabel="歌詞の行間を広くする"/></View>
    </View>
    <View testID="lyric-lines" onLayout={(event) => { lyricsTop.current = event.nativeEvent.layout.y; }} style={[styles.lines, { gap: lineSpacing }]}>{song.lyrics.map((line) => <View key={line.id} testID={`lyric-line-${line.id}`} style={[styles.lineTarget, active?.id === line.id && styles.activeLine]}>
      <VocalLine line={line} symbols={symbols} fontSize={responsiveFontSize} editing={false} selectedRange={active?.id === line.id ? selection?.range : undefined} onPress={() => { if (!line.text) openEditor(line); }} onRangeSelect={active?.id === line.id && selection?.mode === 'highlight' ? (range) => { autoScroll.pause(); setSelection((current) => current ? selectEditorRange(current, line, range) : current); } : undefined} onCharacterPress={(range) => { autoScroll.pause(); Keyboard.dismiss(); setSelection((current) => selectEditorCharacter(current, line.id, range)); }} onAnnotationPress={(annotation) => editAnnotation(line, annotation)} />
      {active?.id === line.id && selection && <QuickAnnotationToolbar key={`${line.id}:${selection.annotationId ?? 'new'}`} line={line} symbols={symbols} mode={selection.mode} onModeChange={(mode) => setSelection((current) => current ? changeEditorMode(current, mode) : current)} range={selection.range} awaitingEnd={!!selection.anchor} awaitingRange={!!selection.pickingStart} onConfirmRange={() => setSelection((current) => current?.range ? { ...current, anchor: undefined, pickingStart: false, revision: current.revision + 1 } : current)} annotation={line.annotations.find((a) => a.id === selection.annotationId)} onClose={closeEditor} onSave={(annotation) => saveAnnotation(line, annotation)} onDelete={(annotationId) => remove(line, annotationId)} onReselect={() => setSelection((current) => current ? reselectHighlight(current) : current)} />}
    </View>)}</View>
    </ScrollView>
    </PracticeScrollArea>
    {autoScrollPanelVisible && <View testID="auto-scroll-popover" style={[styles.autoScrollPopover, { width: Math.min(360, width - 24) }]}>
      <AutoScrollControls running={autoScroll.running} finished={autoScroll.finished} canScroll={autoScroll.canScroll} speed={autoScrollSpeed} error={displayError} onStart={() => { Keyboard.dismiss(); setSelection(undefined); setAutoScrollPanelVisible(false); autoScroll.start(lyricsTop.current); }} onPause={autoScroll.pause} onClose={() => setAutoScrollPanelVisible(false)} onSpeedChange={(delta) => changeDisplay('autoScrollSpeed', delta)} />
    </View>}
    {!autoScrollPanelVisible && !!displayError && <View style={styles.displayError}><Text accessibilityRole="alert" style={{ color: colors.danger }}>{displayError}</Text></View>}
    </View>
  </Screen></>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 1200, padding: 0, gap: 0 },
  workspace: { flex: 1, minHeight: 0, minWidth: 0, width: '100%' },
  lyricScroll: { flex: 1, minHeight: 0, minWidth: 0 },
  lyricContent: { padding: 12, gap: 16, maxWidth: 760, width: '100%', alignSelf: 'center' },
  lineTarget: { borderLeftWidth: 3, borderLeftColor: 'transparent', paddingLeft: 4 },
  activeLine: { borderLeftColor: colors.primary },
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
  autoScrollPopover: { position: 'absolute', top: 8, right: 12, zIndex: 20 },
  displayError: { position: 'absolute', top: 8, left: 12, right: 12, zIndex: 21, padding: 12, borderRadius: 12, backgroundColor: colors.dangerSoft },
});
