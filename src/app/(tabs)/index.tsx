import { Button } from '@/components/common/Button';
import { confirmAction } from '@/components/common/confirmationDialog';
import { PageHeading } from '@/components/common/PageHeading';
import { Screen } from '@/components/common/Screen';
import { EmptySongs } from '@/components/songs/EmptySongs';
import { colors } from '@/constants/theme';
import { useAppData } from '@/features/app/AppProvider';
import { SongLibrary } from '@/features/songs/SongLibrary';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function SongsScreen() {
  const { songs, deleteSong, setSongFavorite, loading, error } = useAppData();
  const router = useRouter();
  const createSong = () => router.push('/songs/new');
  const remove = async (id: string, title: string) => {
    if (await confirmAction('曲を削除しますか？', `「${title}」とすべての記号が削除されます。`, '削除', true)) {
      try { await deleteSong(id); } catch { /* AppProviderのエラーを画面上へ表示する。 */ }
    }
  };

  return <Screen>
    <PageHeading eyebrow="MY SONGS" title="マイソング" description="今日の歌い方を、書きとめよう。" action={songs.length > 0 ? <Button label="＋ 曲を登録" onPress={createSong} /> : undefined} />
    <View style={styles.sectionRow}><View style={styles.sectionTitle}><Text style={styles.sectionLabel}>ソングリスト</Text><Text style={styles.count}>{songs.length} 曲</Text></View><Text style={styles.localBadge}>この端末に保存</Text></View>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>読み込み中…</Text></View>
      : songs.length === 0 ? <EmptySongs onCreate={createSong} />
        : <SongLibrary songs={songs} onFavorite={setSongFavorite}
          onOpen={(song) => router.push(`/songs/${song.id}/map`)} onEdit={(song) => router.push(`/songs/${song.id}/edit`)} onDelete={(song) => void remove(song.id, song.title)} />}
  </Screen>;
}

const styles = StyleSheet.create({
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: { fontSize: 14, color: colors.text, fontWeight: '800' },
  count: { color: colors.primaryDark, backgroundColor: colors.primarySoft, borderRadius: 8, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, fontWeight: '800' },
  localBadge: { fontSize: 10, color: colors.success, fontWeight: '700' },
  error: { color: colors.danger },
  loading: { flexDirection: 'row', gap: 8, paddingVertical: 16 },
  muted: { color: colors.muted },
});
