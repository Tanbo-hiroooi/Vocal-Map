import { Button } from '@/components/common/Button';
import { colors, layout, shadow } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

export function EmptySongs({ onCreate }: { onCreate(): void }) {
  const { width } = useWindowDimensions();
  const compact = width < layout.compactWidth;
  return <View testID="empty-songs-card" style={styles.card}>
    <View style={[styles.intro, compact && styles.introCompact]}>
      <View testID="empty-songs-copy" style={[styles.copy, compact && styles.copyCompact]}>
        <Text style={styles.title}>歌詞に、あなたの歌い方を。</Text>
        <Text style={styles.description}>まだ曲が登録されていません。{'\n'}歌詞を貼り付けて、最初のVocal Mapを作ろう。</Text>
        <Button label="曲を登録" onPress={onCreate} style={styles.action} />
      </View>
      <View testID="empty-songs-sketch" style={[styles.sketch, compact && styles.sketchCompact]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={styles.sketchLabel}>MY SINGING NOTE</Text>
        <View style={styles.markers}>
          <Text style={[styles.marker, { backgroundColor: colors.mint, transform: [{ rotate: '-8deg' }] }]}>↑</Text>
          <Text style={[styles.marker, { backgroundColor: colors.sunshine, transform: [{ rotate: '5deg' }] }]}>mp</Text>
          <Text style={[styles.marker, { backgroundColor: colors.lavender, transform: [{ rotate: '-4deg' }] }]}>／</Text>
        </View>
        <Text style={styles.sample}>声 に の せ て</Text>
        <Text style={styles.sketchMemo}>上にひびかせて、やさしく。</Text>
      </View>
    </View>
    <View testID="empty-songs-steps" style={styles.steps}>
      {[
        { number: '1', title: '曲を登録', color: colors.primarySoft },
        { number: '2', title: '記号をのせる', color: colors.mint },
        { number: '3', title: '歌ってみる', color: colors.sunshine },
      ].map((step) => <View key={step.number} style={styles.step}>
        <Text style={[styles.stepNumber, { backgroundColor: step.color }]}>{step.number}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
      </View>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22, overflow: 'hidden', ...shadow },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 20, padding: 22 },
  introCompact: { flexDirection: 'column-reverse', alignItems: 'stretch', padding: 16, gap: 16 },
  copy: { flex: 1, minWidth: 0, gap: 10 },
  copyCompact: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', width: '100%' },
  title: { fontSize: 23, lineHeight: 32, fontWeight: '900', color: colors.text, letterSpacing: -0.6 },
  description: { fontSize: 13, lineHeight: 21, color: colors.muted },
  action: { alignSelf: 'flex-start', minWidth: 150, marginTop: 3 },
  sketch: { width: 230, padding: 16, borderWidth: 1.5, borderColor: colors.text, borderRadius: 16, backgroundColor: colors.background, gap: 8, transform: [{ rotate: '2deg' }] },
  sketchCompact: { width: '100%', transform: [{ rotate: '0deg' }], paddingVertical: 12 },
  sketchLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.4, color: colors.muted },
  markers: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  marker: { minWidth: 38, height: 35, paddingHorizontal: 6, borderRadius: 10, overflow: 'hidden', textAlign: 'center', lineHeight: 35, color: colors.text, fontSize: 23, fontWeight: '800' },
  sample: { fontSize: 21, fontWeight: '800', color: colors.text, textAlign: 'center', paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: colors.primaryBorder },
  sketchMemo: { fontSize: 11, color: colors.primaryDark, textAlign: 'center' },
  steps: { flexDirection: 'row', gap: 6, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#FFFCF7' },
  step: { flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6 },
  stepNumber: { width: 24, height: 24, lineHeight: 24, textAlign: 'center', borderRadius: 8, overflow: 'hidden', fontSize: 12, fontWeight: '900', color: colors.text },
  stepTitle: { fontSize: 12, fontWeight: '700', color: colors.text },
});
