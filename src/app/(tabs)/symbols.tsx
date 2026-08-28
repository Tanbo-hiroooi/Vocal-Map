import { Button } from '@/components/common/Button';
import { ChoiceChips } from '@/components/common/ChoiceChips';
import { confirmAction } from '@/components/common/confirmationDialog';
import { PageHeading } from '@/components/common/PageHeading';
import { Screen } from '@/components/common/Screen';
import { SymbolEditor } from '@/components/symbols/SymbolEditor';
import { categoryLabels } from '@/constants/presetSymbols';
import { colors, shadow } from '@/constants/theme';
import { SymbolCategory, SymbolDefinition } from '@/domain/models';
import { useAppData } from '@/features/app/AppProvider';
import { vocalMapRepository } from '@/repositories/LocalVocalMapRepository';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

type Filter = SymbolCategory | 'all';
export default function SymbolsScreen() {
  const { symbols, saveSymbol, deleteSymbol, refresh } = useAppData();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>('all');
  const [favorites, setFavorites] = useState(false);
  const [editing, setEditing] = useState<SymbolDefinition | null | undefined>(undefined);
  const visible = useMemo(() => symbols.filter((s) => (filter === 'all' || s.category === filter) && (!favorites || s.isFavorite)), [symbols, filter, favorites]);
  const remove = async (symbol: SymbolDefinition) => {
    if (await confirmAction('記号を削除しますか？', 'すでに歌詞で使われている箇所は「？」表示になります。', '削除', true)) await deleteSymbol(symbol.id);
  };
  const reset = async () => {
    if (!await confirmAction('プリセットを元に戻しますか？', 'プリセット記号への変更が初期状態に戻ります。', '元に戻す')) return;
    await vocalMapRepository.resetPresetSymbols(); await refresh();
  };

  return <Screen>
    <PageHeading eyebrow="SYMBOL LIBRARY" title="記号辞書" description="声のニュアンスに、ぴったりの目印を。" action={<Button label="＋ 新しい記号" onPress={() => setEditing(null)} />} />
    <ChoiceChips value={filter} onChange={setFilter} options={[{ value: 'all', label: 'すべて' }, ...(Object.keys(categoryLabels) as SymbolCategory[]).map((value) => ({ value, label: categoryLabels[value] }))]} />
    <View style={styles.filterRow}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: favorites }} onPress={() => setFavorites(!favorites)} style={[styles.favorite, favorites && styles.favoriteActive]}><Text style={styles.favoriteText}>★ お気に入りのみ</Text></Pressable>
      <Text style={styles.resultCount}>{visible.length} 個の記号</Text>
    </View>
    <View style={styles.list}>{visible.map((symbol, index) => <View key={symbol.id} style={[styles.card, width >= 760 && styles.wideCard]}>
      <View style={styles.cardBody}>
        <View style={[styles.markBox, { backgroundColor: [colors.mint, colors.sunshine, colors.primarySoft, colors.lavender][index % 4] }]}><Text style={[styles.mark, { color: symbol.color || colors.text }]}>{symbol.symbol}</Text></View>
        <View style={styles.description}><View style={styles.nameRow}><Text style={styles.name}>{symbol.name}</Text>{symbol.isFavorite && <Text accessibilityLabel="お気に入り" style={styles.star}>★</Text>}</View><Text style={styles.meaning}>{symbol.meaning || '意味は未設定です。'}</Text></View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.meta}><Text style={styles.badge}>{symbol.isPreset ? 'プリセット' : 'カスタム'}</Text><Text style={styles.category}>{categoryLabels[symbol.category]} · {symbol.order}</Text></View>
        <View style={styles.actions}><Button label="編集" variant="secondary" onPress={() => setEditing(symbol)} />{!symbol.isPreset && <Button label="削除" variant="danger" onPress={() => void remove(symbol)} />}</View>
      </View>
    </View>)}</View>
    {visible.length === 0 && <Text style={styles.empty}>条件に一致する記号がありません。</Text>}
    <Button label="プリセットを元に戻す" variant="ghost" onPress={() => void reset()} />
    {editing !== undefined && <SymbolEditor key={editing?.id ?? 'new'} visible symbol={editing ?? undefined} onClose={() => setEditing(undefined)} onSave={(value) => void saveSymbol(value)} />}
  </Screen>;
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  favorite: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.surface },
  favoriteActive: { backgroundColor: colors.sunshine, borderColor: colors.warning },
  favoriteText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  resultCount: { color: colors.muted, fontSize: 12 },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '100%', minWidth: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, gap: 12, ...shadow },
  wideCard: { flexBasis: '48%', flexGrow: 1, maxWidth: '50%' },
  cardBody: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  markBox: { width: 54, minHeight: 54, padding: 5, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mark: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  description: { flex: 1, minWidth: 0, gap: 4 },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, flexShrink: 1 },
  star: { color: colors.warning },
  meaning: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  meta: { flexShrink: 1, gap: 5 },
  badge: { alignSelf: 'flex-start', fontSize: 10, fontWeight: '700', color: colors.text, backgroundColor: colors.background, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, overflow: 'hidden' },
  category: { fontSize: 10, color: colors.muted },
  actions: { flexDirection: 'row', gap: 5 },
  empty: { textAlign: 'center', padding: 24, color: colors.muted },
});
