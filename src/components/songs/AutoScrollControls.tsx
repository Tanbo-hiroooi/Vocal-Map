import { Button } from '@/components/common/Button';
import { colors } from '@/constants/theme';
import { MAX_AUTO_SCROLL_SPEED, MIN_AUTO_SCROLL_SPEED } from '@/domain/services/autoScroll';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = { running: boolean; finished: boolean; canScroll: boolean; speed: number; error?: string; onStart(): void; onPause(): void; onSpeedChange(delta: number): void };
export function AutoScrollControls({ running, finished, canScroll, speed, error, onStart, onPause, onSpeedChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  if (collapsed) return <View testID="auto-scroll-collapsed" style={[styles.panel, styles.collapsed]}>
    <Button label="自動スクロール" accessibilityLabel="自動スクロールの操作パネルを開く" variant="ghost" onPress={() => setCollapsed(false)} />
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
  return <View testID="auto-scroll-controls" style={styles.panel}>
    <View style={styles.row}><Text style={styles.title}>自動スクロール</Text><View style={styles.headerActions}><Button label={running ? '■ 停止' : '▶ 開始'} accessibilityLabel={running ? '自動スクロールを停止' : '自動スクロールを開始'} variant={running ? 'secondary' : 'primary'} disabled={!running && !canScroll} onPress={running ? onPause : onStart} /><Button label="閉じる" accessibilityLabel="自動スクロールの操作パネルを閉じる" variant="ghost" onPress={() => { onPause(); setCollapsed(true); }} /></View></View>
    <View style={styles.speed}><Text style={styles.label}>速度</Text><Button label="ゆっくり" accessibilityLabel="自動スクロールを遅くする" variant="ghost" disabled={speed <= MIN_AUTO_SCROLL_SPEED} onPress={() => onSpeedChange(-1)} /><Text testID="auto-scroll-speed" accessibilityLabel={`スクロール速度 ${speed}、10段階`} style={styles.value}>{speed} / 10</Text><Button label="速く" accessibilityLabel="自動スクロールを速くする" variant="ghost" disabled={speed >= MAX_AUTO_SCROLL_SPEED} onPress={() => onSpeedChange(1)} /></View>
    <Text testID="auto-scroll-status" accessibilityLiveRegion="polite" style={styles.hint}>{running ? 'スクロール中・歌詞に触れると停止します' : finished ? '最後まで進みました。開始すると歌詞の先頭へ戻ります。' : !canScroll ? 'スクロールできる長さの歌詞で開始できます。' : '速度はこの端末に保存されます。開始は手動です。'}</Text>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  panel: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, gap: 2 },
  collapsed: { paddingVertical: 2, alignItems: 'flex-end' }, headerActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 4 }, title: { color: colors.text, fontWeight: '800', fontSize: 14 },
  speed: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 2 }, label: { color: colors.muted, fontSize: 12 }, value: { minWidth: 45, color: colors.primary, fontWeight: '800', textAlign: 'center' },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 16 }, error: { color: colors.danger, fontSize: 12 },
});
