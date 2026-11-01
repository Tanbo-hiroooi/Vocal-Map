import { Button } from '@/components/common/Button';
import { SongCard } from '@/components/songs/SongCard';
import { colors } from '@/constants/theme';
import { Song } from '@/domain/models';
import { getSongTags, selectSongs, SongSort, songSortOptions } from '@/domain/services/songLibrary';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

const PAGE_SIZE = 24;
type Props = {
  songs: Song[];
  onOpen(song: Song): void;
  onEdit(song: Song): void;
  onDelete(song: Song): void;
  onFavorite(id: string, favorite: boolean): Promise<void>;
};

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress(): void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }}
    onPress={onPress} style={[styles.chip, selected && styles.selectedChip]}>
    <Text style={[styles.chipText, selected && styles.selectedText]}>{label}</Text>
  </Pressable>;
}

export function SongLibrary({ songs, onOpen, onEdit, onDelete, onFavorite }: Props) {
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState<SongSort>('updated');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [showAllTags, setShowAllTags] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const pendingIds = useRef(new Set<string>());
  const [error, setError] = useState('');
  const { width } = useWindowDimensions();
  const tags = useMemo(() => getSongTags(songs), [songs]);
  const filtered = useMemo(() => selectSongs(songs, { query, favoritesOnly, tag, sort }), [songs, query, favoritesOnly, tag, sort]);
  const reset = () => { setQuery(''); setFavoritesOnly(false); setTag(''); setLimit(PAGE_SIZE); };
  const toggleFavorite = async (song: Song) => {
    if (pendingIds.current.has(song.id)) return;
    pendingIds.current.add(song.id); setPending([...pendingIds.current]); setError('');
    try { await onFavorite(song.id, !song.isFavorite); }
    catch { setError('お気に入りを保存できませんでした。もう一度お試しください。'); }
    finally { pendingIds.current.delete(song.id); setPending([...pendingIds.current]); }
  };

  return <View style={styles.library}>
    <View style={styles.controls}>
      <View style={styles.searchRow}>
        <TextInput accessibilityLabel="曲を検索" placeholder="曲名・アーティスト・タグ・メモで検索" placeholderTextColor={colors.muted}
          value={query} onChangeText={(value) => { setQuery(value); setLimit(PAGE_SIZE); }} style={styles.search}
          returnKeyType="search" autoCorrect={false} clearButtonMode="never" />
        {!!query && <Button label="×" accessibilityLabel="検索文字をクリア" variant="ghost" onPress={() => { setQuery(''); setLimit(PAGE_SIZE); }} />}
      </View>
      <View style={styles.row}>
        <FilterChip label="すべての曲" selected={!favoritesOnly} onPress={() => { setFavoritesOnly(false); setLimit(PAGE_SIZE); }} />
        <FilterChip label="★ お気に入り" selected={favoritesOnly} onPress={() => { setFavoritesOnly(true); setLimit(PAGE_SIZE); }} />
      </View>
      {tags.length > 0 && <View style={styles.group}>
        <Text style={styles.label}>タグで絞り込み</Text>
        <View style={styles.row}>
          <FilterChip label="すべてのタグ" selected={!tag} onPress={() => { setTag(''); setLimit(PAGE_SIZE); }} />
          {(showAllTags ? tags : tags.slice(0, 6)).map((value) => <FilterChip key={value} label={`# ${value}`} selected={tag === value}
            onPress={() => { setTag(tag === value ? '' : value); setLimit(PAGE_SIZE); }} />)}
          {tags.length > 6 && <Button label={showAllTags ? 'タグを閉じる' : `ほか${tags.length - 6}件のタグ`} variant="ghost" onPress={() => setShowAllTags(!showAllTags)} />}
        </View>
      </View>}
      <View style={styles.group}><Text style={styles.label}>並び替え</Text><View style={styles.row}>
        {songSortOptions.map((option) => <FilterChip key={option.value} label={option.label} selected={sort === option.value}
          onPress={() => { setSort(option.value); setLimit(PAGE_SIZE); }} />)}
      </View></View>
    </View>
    <View style={styles.results}>
      <Text accessibilityLiveRegion="polite" style={styles.resultText}>{filtered.length} / {songs.length} 曲{tag ? ` ・ # ${tag}` : ''}</Text>
      {(!!query || favoritesOnly || !!tag) && <Button label="絞り込みを解除" variant="ghost" onPress={reset} />}
    </View>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {filtered.length === 0 ? <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{favoritesOnly && !query && !tag ? 'お気に入りの曲はまだありません' : '条件に合う曲が見つかりませんでした'}</Text>
      <Text style={styles.hint}>{favoritesOnly ? '曲カードの☆を押すと、お気に入りに登録できます。' : '検索文字やタグを変えて、もう一度お試しください。'}</Text>
      <Button label="すべての曲を表示" variant="secondary" onPress={reset} />
    </View> : <View style={styles.list}>
      {filtered.slice(0, limit).map((song, index) => <SongCard key={song.id} song={song} index={index}
        style={width >= 760 ? styles.wideCard : undefined} onOpen={() => onOpen(song)} onEdit={() => onEdit(song)} onDelete={() => onDelete(song)}
        onFavorite={() => void toggleFavorite(song)} favoriteSaving={pending.includes(song.id)} />)}
    </View>}
    {filtered.length > limit && <Button label={`もっと表示（残り${filtered.length - limit}曲）`} variant="secondary" onPress={() => setLimit(limit + PAGE_SIZE)} />}
  </View>;
}

const styles = StyleSheet.create({
  library: { gap: 12, minWidth: 0 },
  controls: { padding: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, gap: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  search: { flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: 12, fontSize: 16, color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  group: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted },
  chip: { minHeight: 44, maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  selectedChip: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.text, flexShrink: 1 },
  selectedText: { color: colors.primaryDark },
  results: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  resultText: { color: colors.muted, fontSize: 13, flexShrink: 1 },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  wideCard: { flexBasis: '48%', flexGrow: 1, maxWidth: '50%' },
  empty: { padding: 20, borderRadius: 18, backgroundColor: colors.surface, gap: 12 },
  emptyTitle: { fontWeight: '800', color: colors.text, fontSize: 17 },
  hint: { color: colors.muted, lineHeight: 21 },
  error: { color: colors.danger },
});
