import { FormField } from '@/components/common/FormField';
import { colors } from '@/constants/theme';
import { Annotation } from '@/domain/models';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export const highlightColors = [
  { name: 'ラベンダー', color: '#E9E3FF' },
  { name: 'ミント', color: '#DCF3E9' },
  { name: '黄色', color: '#FFE7A0' },
  { name: '水色', color: '#DDE8FF' },
  { name: 'ピンク', color: '#FFDDE6' },
];
const presets = [
  { label: '裏声', color: highlightColors[0].color },
  { label: 'ミックス', color: highlightColors[1].color },
  { label: '地声', color: highlightColors[2].color },
];
type Highlight = NonNullable<Annotation['highlight']>;

export function HighlightPicker({ value, onChange }: { value: Highlight; onChange(value: Highlight): void }) {
  return <View style={styles.body}>
    <Text style={styles.hint}>歌い方を選ぶと背景色が付きます。名前と色は自由に組み合わせられます。</Text>
    <View style={styles.row}>{presets.map((preset) => <Pressable key={preset.label} accessibilityRole="radio" accessibilityLabel={`${preset.label}で色分け`} accessibilityState={{ checked: value.label === preset.label && value.color === preset.color }} onPress={() => onChange(preset)} style={[styles.choice, { backgroundColor: preset.color }, value.label === preset.label && styles.selected]}><Text style={styles.label}>{preset.label}</Text></Pressable>)}</View>
    <FormField label="歌い方の名前" value={value.label} onChangeText={(label) => onChange({ ...value, label })} placeholder="例：裏声、ミックス、息多め" />
    <Text style={styles.label}>背景色</Text>
    <View style={styles.row}>{highlightColors.map((item) => <Pressable key={item.color} accessibilityRole="radio" accessibilityLabel={`背景色：${item.name}`} accessibilityState={{ checked: value.color === item.color }} onPress={() => onChange({ ...value, color: item.color })} style={[styles.choice, { backgroundColor: item.color }, value.color === item.color && styles.selected]}><Text style={styles.label}>{value.color === item.color ? '✓ ' : ''}{item.name}</Text></Pressable>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  body: { gap: 12 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  selected: { borderColor: colors.text }, label: { color: colors.text, fontSize: 14, fontWeight: '700' }, hint: { color: colors.muted, lineHeight: 20 },
});
