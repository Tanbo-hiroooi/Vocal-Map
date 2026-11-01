import SongsScreen from '@/app/(tabs)/index';
import { Song } from '@/domain/models';
import { getSongTags, parseSongTags, selectSongs } from '@/domain/services/songLibrary';
import { validateImportData } from '@/domain/validators/importData';
import { SongForm } from '@/features/songs/SongForm';
import { SongLibrary } from '@/features/songs/SongLibrary';
import { LocalVocalMapRepository } from '@/repositories/LocalVocalMapRepository';
import { createInitialData, CURRENT_SCHEMA_VERSION, migrateData } from '@/storage/migrations';
import { storage } from '@/storage/storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/storage/storage', () => {
  const values = new Map<string, string>();
  return { storage: { getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => { values.set(key, value); },
    removeItem: async (key: string) => { values.delete(key); } } };
});
const mockUseAppData = jest.fn();
const mockPush = jest.fn();
jest.mock('@/features/app/AppProvider', () => ({ useAppData: () => mockUseAppData() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const song = (id: string, extra: Partial<Song> = {}): Song => ({ id, title: `曲${id}`, artist: '歌手',
  lyrics: [{ id: `line-${id}`, text: '自分の練習用歌詞', order: 0, annotations: [] }],
  createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', ...extra });
const songs = [song('1', { title: 'カナリア', artist: 'VOICE', tags: ['レッスン'], isFavorite: true }),
  song('2', { title: 'あおぞら', memo: '本番キー', tags: ['練習中'], updatedAt: '2026-10-02T00:00:00Z' })];
const options = { query: '', favoritesOnly: false, tag: '', sort: 'updated' as const };
const props = { onOpen: jest.fn(), onEdit: jest.fn(), onDelete: jest.fn(), onFavorite: jest.fn(async () => {}) };

beforeEach(async () => { jest.clearAllMocks(); await storage.removeItem('vocal-map-data'); });

test('検索は表記揺れを吸収し、曲名・歌手・メモ・タグを複数キーワードで探せる', () => {
  expect(selectSongs(songs, { ...options, query: 'かなりあ ｖｏｉｃｅ' }).map((s) => s.id)).toEqual(['1']);
  expect(selectSongs(songs, { ...options, query: '本番 練習中' }).map((s) => s.id)).toEqual(['2']);
  expect(selectSongs(songs, { ...options, query: 'ない曲' })).toEqual([]);
});
test('お気に入り・タグ・検索を組み合わせて絞り込める', () => {
  expect(selectSongs(songs, { ...options, favoritesOnly: true, tag: 'れっすん', query: 'VOICE' }).map((s) => s.id)).toEqual(['1']);
  expect(selectSongs(songs, { ...options, favoritesOnly: true, tag: '練習中' })).toEqual([]);
});
test('更新順・登録順・曲名順・アーティスト順に並び、入力配列を変えない', () => {
  const input = [song('1', { title: '曲10', artist: undefined, createdAt: '2026-10-02' }), song('2', { title: '曲2', artist: 'あ' })];
  expect(selectSongs(songs, options).map((s) => s.id)).toEqual(['2', '1']);
  expect(selectSongs(input, { ...options, sort: 'created' }).map((s) => s.id)).toEqual(['1', '2']);
  expect(selectSongs(input, { ...options, sort: 'title' }).map((s) => s.id)).toEqual(['2', '1']);
  expect(selectSongs(input, { ...options, sort: 'artist' }).map((s) => s.id)).toEqual(['2', '1']);
  expect(input.map((s) => s.id)).toEqual(['1', '2']);
});
test('タグは空白と重複を除き、全曲から候補を集める', () => {
  expect(parseSongTags(' レッスン、練習中,れっすん，\n本番、、')).toEqual(['レッスン', '練習中', '本番']);
  expect(getSongTags([...songs, song('3', { tags: ['れっすん'] })])).toHaveLength(2);
});
test('旧schemaの曲を歌詞や日時を変えず移行する', () => {
  const migrated = migrateData({ ...createInitialData(), schemaVersion: 9, songs: [song('old')] });
  expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  expect(migrated.songs[0]).toEqual({ ...song('old'), tags: [], isFavorite: false });
  expect(migrateData(migrated)).toEqual(migrated);
});
test('不正なタグやお気に入りをインポートで拒否する', () => {
  const initial = createInitialData();
  for (const extra of [{ tags: '本番' }, { tags: [1] }, { isFavorite: 'yes' }]) {
    expect(validateImportData({ ...initial, songs: [{ ...song('bad'), ...extra }] }).valid).toBe(false);
  }
  expect(validateImportData({ ...initial, songs }).valid).toBe(true);
});
test('お気に入り・タグは再起動とバックアップ復元後も残り、更新日時を変えない', async () => {
  const repo = new LocalVocalMapRepository();
  await repo.saveSong(songs[1]);
  await repo.setSongFavorite('2', true);
  const reopened = new LocalVocalMapRepository();
  expect(await reopened.getSong('2')).toEqual({ ...songs[1], isFavorite: true });
  const backup = await reopened.exportData();
  await reopened.clearAll();
  await reopened.importData(backup, 'replace');
  expect(await reopened.getSong('2')).toEqual({ ...songs[1], isFavorite: true });
});
test('お気に入り変更がキュー内の新しい歌詞・タイトルを上書きしない', async () => {
  const repo = new LocalVocalMapRepository();
  await repo.saveSong(songs[0]);
  await Promise.all([repo.saveSong({ ...songs[0], title: '変更後の曲' }), repo.setSongFavorite('1', false)]);
  expect(await repo.getSong('1')).toMatchObject({ title: '変更後の曲', isFavorite: false });
});
test('曲一覧画面で検索して目的の曲を開ける', async () => {
  mockUseAppData.mockReturnValue({ songs, setSongFavorite: props.onFavorite, deleteSong: props.onDelete, loading: false, error: null });
  const view = await render(<SongsScreen />);
  await fireEvent.changeText(view.getByLabelText('曲を検索'), 'カナリア');
  expect(view.queryByText('あおぞら')).toBeNull();
  await fireEvent.press(view.getByRole('button', { name: 'カナリアを開く' }));
  expect(mockPush).toHaveBeenCalledWith('/songs/1/map');
});
test('一覧のタグとお気に入りを組み合わせ、条件を解除できる', async () => {
  const view = await render(<SongLibrary songs={songs} {...props} />);
  await fireEvent.press(view.getByRole('button', { name: '★ お気に入り' }));
  expect(view.queryByText('あおぞら')).toBeNull();
  await fireEvent.press(view.getByRole('button', { name: '# 練習中' }));
  expect(view.getByText('条件に合う曲が見つかりませんでした')).toBeTruthy();
  await fireEvent.press(view.getByRole('button', { name: 'すべての曲を表示' }));
  expect(view.getByText('あおぞら')).toBeTruthy();
  await fireEvent.press(view.getByRole('button', { name: 'あおぞらをお気に入りに追加' }));
  expect(props.onFavorite).toHaveBeenCalledWith('2', true);
});
test('お気に入り保存の失敗を日本語で表示し、再試行できる', async () => {
  const save = jest.fn().mockRejectedValueOnce(new Error('full')).mockResolvedValue(undefined);
  const view = await render(<SongLibrary songs={songs} {...props} onFavorite={save} />);
  await fireEvent.press(view.getByRole('button', { name: 'あおぞらをお気に入りに追加' }));
  await waitFor(() => expect(view.getByRole('alert')).toBeTruthy());
  await fireEvent.press(view.getByRole('button', { name: 'あおぞらをお気に入りに追加' }));
  await waitFor(() => expect(view.queryByRole('alert')).toBeNull());
  expect(save).toHaveBeenCalledTimes(2);
});
test('大量の曲は24件ずつ表示し、検索対象には未表示の曲も含む', async () => {
  const many = Array.from({ length: 50 }, (_, index) => song(String(index + 1)));
  const view = await render(<SongLibrary songs={many} {...props} />);
  expect(view.getAllByRole('button', { name: /を開く$/ })).toHaveLength(24);
  await fireEvent.press(view.getByRole('button', { name: 'もっと表示（残り26曲）' }));
  expect(view.getAllByRole('button', { name: /を開く$/ })).toHaveLength(48);
  await fireEvent.changeText(view.getByLabelText('曲を検索'), '曲50');
  expect(view.getAllByRole('button', { name: /を開く$/ })).toHaveLength(1);
  expect(view.getByText('曲50')).toBeTruthy();
});
test('曲情報編集でタグを保存し、お気に入りを維持する', async () => {
  const save = jest.fn(async (_song: Song) => {});
  const view = await render(<SongForm song={songs[0]} onSave={save} />);
  await fireEvent.changeText(view.getByLabelText('整理用タグ'), '本番、練習中、本番');
  await fireEvent.press(view.getByRole('button', { name: '保存する' }));
  await waitFor(() => expect(save).toHaveBeenCalled());
  expect(save.mock.calls[0][0]).toMatchObject({ tags: ['本番', '練習中'], isFavorite: true, lyrics: songs[0].lyrics });
});
