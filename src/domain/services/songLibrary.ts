import { Song } from '@/domain/models';

export type SongSort = 'updated' | 'created' | 'title' | 'artist';
export const songSortOptions: { value: SongSort; label: string }[] = [
  { value: 'updated', label: '更新順' }, { value: 'created', label: '登録順' },
  { value: 'title', label: '曲名順' }, { value: 'artist', label: 'アーティスト順' },
];

// 全角英数字・英字の大文字小文字・ひらがな/カタカナの違いを吸収する。
export function normalizeSongSearch(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ja-JP')
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

export function parseSongTags(value: string): string[] {
  const seen = new Set<string>();
  return value.split(/[,、，\n]/).map((tag) => tag.trim()).filter((tag) => {
    const key = normalizeSongSearch(tag);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function getSongTags(songs: Song[]): string[] {
  return parseSongTags(songs.flatMap((song) => song.tags ?? []).join('\n'))
    .sort((a, b) => a.localeCompare(b, 'ja'));
}

export function selectSongs(songs: Song[], options: { query: string; favoritesOnly: boolean; tag: string; sort: SongSort }): Song[] {
  const words = normalizeSongSearch(options.query).trim().split(/\s+/).filter(Boolean);
  const compareText = (a: string, b: string) => a.localeCompare(b, 'ja', { numeric: true, sensitivity: 'base' });
  return songs.filter((song) => {
    if (options.favoritesOnly && !song.isFavorite) return false;
    if (options.tag && !(song.tags ?? []).some((tag) => normalizeSongSearch(tag) === normalizeSongSearch(options.tag))) return false;
    const text = normalizeSongSearch([song.title, song.artist, song.memo, ...(song.tags ?? [])].filter(Boolean).join(' '));
    return words.every((word) => text.includes(word));
  }).sort((a, b) => {
    let order = 0;
    if (options.sort === 'title') order = compareText(a.title, b.title);
    else if (options.sort === 'artist') order = compareText(a.artist || '\uffff', b.artist || '\uffff') || compareText(a.title, b.title);
    else if (options.sort === 'created') order = (b.createdAt || '').localeCompare(a.createdAt || '');
    else order = (b.updatedAt || '').localeCompare(a.updatedAt || '');
    return order || compareText(a.title, b.title) || a.id.localeCompare(b.id);
  });
}
