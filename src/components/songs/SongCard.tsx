import { Button } from '@/components/common/Button';
import { colors, shadow } from '@/constants/theme';
import { Song } from '@/domain/models';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

export function SongCard({ song, index, onOpen, onEdit, onDelete, onFavorite, favoriteSaving, style }: { song: Song; index: number; onOpen(): void; onEdit(): void; onDelete(): void; onFavorite?(): void; favoriteSaving?: boolean; style?: ViewStyle }) {
  const accent = [colors.primarySoft, colors.mint, colors.sunshine, colors.lavender][index % 4];
  const annotationCount = song.lyrics.reduce((total, line) => total + line.annotations.length, 0);
  return <View style={[styles.card, style]}>
    <View style={styles.heading}><Pressable accessibilityRole="button" accessibilityLabel={`${song.title}を開く`} onPress={onOpen} style={({ pressed }) => [styles.summary, pressed && styles.pressed]}>
      <View style={[styles.artwork, { backgroundColor: accent }]}><Text aria-hidden style={styles.note}>♫</Text></View>
      <View style={styles.copy}><Text numberOfLines={2} style={styles.title}>{song.title}</Text><Text numberOfLines={1} style={styles.artist}>{song.artist || 'アーティスト未設定'}</Text></View>
      <Text aria-hidden style={styles.arrow}>↗</Text>
    </Pressable>{onFavorite && <Pressable accessibilityRole="button" accessibilityLabel={`${song.title}をお気に入り${song.isFavorite ? 'から外す' : 'に追加'}`} accessibilityState={{ selected: !!song.isFavorite, disabled: favoriteSaving }} disabled={favoriteSaving} onPress={onFavorite} style={[styles.favorite, song.isFavorite && styles.favoriteActive]}><Text style={styles.star}>{song.isFavorite ? '★' : '☆'}</Text></Pressable>}</View>
    {!!song.tags?.length && <View style={styles.tags}>{song.tags.map((tag, tagIndex) => <Text key={`${tagIndex}-${tag}`} style={styles.tag}>{tag}</Text>)}</View>}
    <View style={styles.details}><Text style={[styles.count, { backgroundColor: accent }]}>記号 {annotationCount} 個</Text><Text style={styles.date}>更新 {new Date(song.updatedAt).toLocaleDateString('ja-JP')}</Text></View>
    <View style={styles.actions}><Button label="開く →" onPress={onOpen} style={styles.open} /><Button label="編集" variant="secondary" onPress={onEdit} /><Button label="削除" variant="danger" onPress={onDelete} /></View>
  </View>;
}

const styles = StyleSheet.create({
  card: { width: '100%', minWidth: 0, backgroundColor: colors.surface, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: colors.border, gap: 12, ...shadow },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summary: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 54 },
  favorite: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  favoriteActive: { backgroundColor: colors.sunshine },
  star: { fontSize: 26, color: colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { maxWidth: '100%', color: colors.success, backgroundColor: colors.mint, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, fontSize: 12 },
  artwork: { width: 50, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 29, color: colors.text },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 19, fontWeight: '900', color: colors.text },
  artist: { fontSize: 13, color: colors.muted },
  arrow: { fontSize: 24, color: colors.primary, fontWeight: '800' },
  details: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  count: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, overflow: 'hidden', fontSize: 11, fontWeight: '800', color: colors.text },
  date: { fontSize: 11, color: colors.muted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  open: { flex: 1, minWidth: 76 },
  pressed: { opacity: 0.7 },
});
