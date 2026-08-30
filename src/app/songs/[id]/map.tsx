import { AnnotationEditor } from '@/components/annotations/AnnotationEditor';
import { VocalLine } from '@/components/annotations/VocalLine';
import { Button } from '@/components/common/Button';
import { confirmAction } from '@/components/common/confirmationDialog';
import { Screen } from '@/components/common/Screen';
import { colors } from '@/constants/theme';
import { LyricLine, TextRange } from '@/domain/models';
import { useAppData } from '@/features/app/AppProvider';
import { nowIso } from '@/utils/id';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export default function MapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { songs, symbols, settings, saveSong, saveSettings, loading } = useAppData();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const song = songs.find((item) => item.id === id);
  const [active, setActive] = useState<LyricLine | null>(null);
  const [activeRange, setActiveRange] = useState<TextRange>();
  const [fontSize, setFontSize] = useState(settings.practiceFontSize);
  const [lineSpacing, setLineSpacing] = useState(settings.lyricLineSpacing);
  const settingsLoaded = useRef(false);

  useEffect(() => {
    if (loading || settingsLoaded.current) return;
    setFontSize(settings.practiceFontSize);
    setLineSpacing(settings.lyricLineSpacing);
    settingsLoaded.current = true;
  }, [loading, settings.lyricLineSpacing, settings.practiceFontSize]);

  if (loading) return <Screen><Text>読み込み中…</Text></Screen>;
  if (!song) return <Screen><Text accessibilityRole="alert">曲が見つかりません。削除された可能性があります。</Text><Button label="曲一覧へ" onPress={() => router.replace('/')} /></Screen>;

  const responsiveFontSize = Math.min(fontSize, width < 380 ? 30 : 38);
  const changeLineSpacing = (delta: number) => {
    const next = Math.max(0, Math.min(24, lineSpacing + delta));
    setLineSpacing(next);
    void saveSettings({ ...settings, lyricLineSpacing: next });
  };
  const closeEditor = () => { setActive(null); setActiveRange(undefined); };
  const openEditor = (line: LyricLine, range?: TextRange) => { setActiveRange(range); setActive(line); };
  const updateLine = async (lineId: string, annotations: LyricLine['annotations']) => saveSong({ ...song, lyrics: song.lyrics.map((line) => line.id === lineId ? { ...line, annotations } : line), updatedAt: nowIso() });
  const remove = async (line: LyricLine, annotationId: string) => {
    if (!await confirmAction('記号を削除しますか？', 'この歌詞行から記号を外します。', '削除', true)) return;
    await updateLine(line.id, line.annotations.filter((annotation) => annotation.id !== annotationId));
    closeEditor();
  };

  return <Screen contentStyle={styles.screen}>
    <View style={styles.header}><View style={styles.heading}><Text style={styles.title}>{song.title}</Text><Text style={styles.artist}>{song.artist || 'アーティスト未設定'}</Text></View><Button label="曲情報を編集" variant="secondary" onPress={() => router.push(`/songs/${song.id}/edit`)} /></View>
    {song.memo && <Text style={styles.songMemo}>{song.memo}</Text>}
    <View style={styles.guide}><Text style={styles.guideTitle}>歌詞を選択して記号を追加</Text><Text style={styles.guideText}>PCでは歌詞の変更したい部分をドラッグすると、記号追加画面が開きます。iPhoneでは歌詞行をタップし、対象語句の先頭と末尾を選択してください。</Text></View>
    <View style={styles.controls}>
      <View style={styles.controlGroup}><Text style={styles.controlLabel}>文字サイズ</Text><Button label="小さく" variant="ghost" onPress={() => setFontSize(Math.max(20, fontSize - 2))} accessibilityLabel="歌詞の文字を小さくする"/><Text style={styles.size}>{fontSize}</Text><Button label="大きく" variant="ghost" onPress={() => setFontSize(Math.min(42, fontSize + 2))} accessibilityLabel="歌詞の文字を大きくする"/></View>
      <View style={styles.controlGroup}><Text style={styles.controlLabel}>行間</Text><Button label="狭く" variant="ghost" onPress={() => changeLineSpacing(-2)} accessibilityLabel="歌詞の行間を狭くする"/><Text style={styles.size}>{lineSpacing}</Text><Button label="広く" variant="ghost" onPress={() => changeLineSpacing(2)} accessibilityLabel="歌詞の行間を広くする"/></View>
    </View>
    <View testID="lyric-lines" style={[styles.lines, { gap: lineSpacing }]}>{song.lyrics.map((line) => <VocalLine key={line.id} line={line} symbols={symbols} fontSize={responsiveFontSize} editing={false} onPress={() => openEditor(line)} onRangeSelect={(range) => openEditor(line, range)} />)}</View>
    {active && <AnnotationEditor key={`${active.id}-${activeRange?.start ?? 'line'}-${activeRange?.end ?? 'line'}`} visible line={active} symbols={symbols} initialRange={activeRange} onClose={closeEditor} onSave={(annotation) => void updateLine(active.id, [...active.annotations, annotation])} onDelete={(annotationId) => void remove(active, annotationId)} />}
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 760 },
  header: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  heading: { flex: 1, minWidth: 180 },
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
