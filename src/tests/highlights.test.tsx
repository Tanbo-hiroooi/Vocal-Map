import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { AnnotationEditor } from '@/components/annotations/AnnotationEditor';
import { VocalLine } from '@/components/annotations/VocalLine';
import { Annotation, LyricLine, Song } from '@/domain/models';
import { createLyricSegments, createTextBoundary, hasOverlappingRange, updateSongLyrics } from '@/domain/services/lyrics';
import { parseImportJson, validateImportData } from '@/domain/validators/importData';
import { createInitialData, CURRENT_SCHEMA_VERSION, migrateData } from '@/storage/migrations';
import { LocalVocalMapRepository } from '@/repositories/LocalVocalMapRepository';

jest.mock('@/storage/storage', () => {
  const values = new Map<string, string>();
  return { storage: {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => { values.set(key, value); },
    removeItem: async (key: string) => { values.delete(key); },
  } };
});

const line: LyricLine = { id: 'line', text: '君に伝えたい', order: 0, annotations: [] };
const highlight: Annotation = {
  id: 'highlight', symbolId: '', position: 'above', targetType: 'range', range: { start: 2, end: 6 },
  targetTextSnapshot: '伝えたい', highlight: { label: '裏声', color: '#E9E3FF' },
  status: 'valid', createdAt: '2026-09-12T00:00:00Z', updatedAt: '2026-09-12T00:00:00Z',
};
const symbol: Annotation = { ...highlight, id: 'arrow', highlight: undefined, symbolId: 'arrow', range: { start: 3, end: 5 }, targetTextSnapshot: 'えた' };
const song: Song = { id: 'song', title: '確認曲', lyrics: [{ ...line, annotations: [highlight] }], createdAt: '', updatedAt: '' };

describe('歌い方の背景色', () => {
  test('記号・ブレスで分割されても選択範囲だけを連続して着色する', () => {
    const breath: Annotation = { ...symbol, id: 'breath', targetType: 'boundary', range: undefined, boundary: createTextBoundary(line.text, 4) };
    const segments = createLyricSegments(line.text, [highlight, symbol, breath]);
    expect(segments.map((s) => s.text).join('')).toBe(line.text);
    expect(segments.filter((s) => s.highlight).map((s) => s.text).join('')).toBe('伝えたい');
    expect(segments.flatMap((s) => s.annotations).map((a) => a.id)).toEqual(['arrow']);
    expect(segments.flatMap((s) => s.boundaryAnnotations).map((a) => a.id)).toEqual(['breath']);
  });

  test('記号と背景色は併用でき、背景色同士の重複は拒否する', () => {
    expect(hasOverlappingRange([symbol], highlight.range!, undefined, 'highlight')).toBe(false);
    expect(hasOverlappingRange([highlight], symbol.range!)).toBe(false);
    expect(hasOverlappingRange([highlight], { start: 4, end: 6 }, undefined, 'highlight')).toBe(true);
    expect(hasOverlappingRange([highlight], { start: 0, end: 2 }, undefined, 'highlight')).toBe(false);
  });

  test('ドラッグした語句にミックスを指定し、歌詞表示に反映する', async () => {
    const save = jest.fn();
    const editor = await render(<AnnotationEditor visible line={{ ...line, annotations: [symbol] }} symbols={[]} initialRange={{ start: 2, end: 6 }} onClose={() => {}} onSave={save} />);
    await fireEvent.press(editor.getByText('背景色で歌い方を指定'));
    await fireEvent.press(editor.getByLabelText('ミックスで色分け'));
    await fireEvent.press(editor.getByText('この色分けを追加'));
    const saved = save.mock.calls[0][0];
    expect(saved).toMatchObject({ range: { start: 2, end: 6 }, targetTextSnapshot: '伝えたい', highlight: { label: 'ミックス', color: '#DCF3E9' } });
    await editor.unmount();
    const view = await render(<VocalLine line={{ ...line, annotations: [saved] }} symbols={[]} editing={false} />);
    expect(StyleSheet.flatten(view.getByText('君に').props.style).backgroundColor).toBeUndefined();
    expect(StyleSheet.flatten(view.getByText('伝えたい').props.style).backgroundColor).toBe('#DCF3E9');
    expect(view.getByText('ミックス：「伝えたい」')).toBeTruthy();
    expect(view.queryByTestId('range-marker-lane')).toBeNull();
  });

  test('スマホの文字選択から独自の名前・色を保存できる', async () => {
    const save = jest.fn();
    const view = await render(<AnnotationEditor visible line={line} symbols={[]} onClose={() => {}} onSave={save} />);
    await fireEvent.press(view.getByText('背景色で歌い方を指定'));
    await fireEvent.press(view.getByLabelText('3文字目「伝」'));
    await fireEvent.press(view.getByLabelText('6文字目「い」'));
    await fireEvent.changeText(view.getByPlaceholderText('例：裏声、ミックス、息多め'), '息多め');
    await fireEvent.press(view.getByLabelText('背景色：水色'));
    await fireEvent.press(view.getByText('この色分けを追加'));
    expect(save.mock.calls[0][0]).toMatchObject({ range: { start: 2, end: 6 }, highlight: { label: '息多め', color: '#DDE8FF' } });
  });

  test('範囲未選択・空の名前・重複した色分けは保存しない', async () => {
    const save = jest.fn();
    const view = await render(<AnnotationEditor visible line={{ ...line, annotations: [highlight] }} symbols={[]} onClose={() => {}} onSave={save} />);
    await fireEvent.press(view.getByText('背景色で歌い方を指定'));
    await fireEvent.press(view.getByText('この色分けを追加'));
    expect(view.getByRole('alert')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('3文字目「伝」'));
    await fireEvent.press(view.getByLabelText('6文字目「い」'));
    await fireEvent.changeText(view.getByPlaceholderText('例：裏声、ミックス、息多め'), ' ');
    await fireEvent.press(view.getByText('この色分けを追加'));
    expect(view.getByText('歌い方の名前を入力してください。')).toBeTruthy();
    await fireEvent.changeText(view.getByPlaceholderText('例：裏声、ミックス、息多め'), 'ミックス');
    await fireEvent.press(view.getByText('この色分けを追加'));
    expect(view.getByText(/この範囲にはすでに色分けがあります/)).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
  });

  test('色分けを対象語句の名前付きで削除できる', async () => {
    const remove = jest.fn();
    const view = await render(<AnnotationEditor visible line={song.lyrics[0]} symbols={[]} onClose={() => {}} onSave={() => {}} onDelete={remove} />);
    await fireEvent.press(view.getByText('裏声の色分けを削除（伝えたい）'));
    expect(remove).toHaveBeenCalledWith('highlight');
  });

  test('歌詞変更で一意な範囲へ追従し、曖昧なら着色を止めて要確認を表示する', async () => {
    const moved = updateSongLyrics(song, '今君に伝えたい')[0];
    expect(moved.annotations[0]).toMatchObject({ range: { start: 3, end: 7 }, highlight: highlight.highlight, status: 'valid' });
    const ambiguous = updateSongLyrics(song, '伝えたい伝えたい')[0];
    expect(ambiguous.annotations[0].status).toBe('needs-review');
    expect(createLyricSegments(ambiguous.text, ambiguous.annotations).every((s) => !s.highlight)).toBe(true);
    const view = await render(<VocalLine line={ambiguous} symbols={[]} editing={false} />);
    expect(view.getByText(/裏声.*要確認/)).toBeTruthy();
  });

  test('保存・再起動・JSONの出力と復元で背景色と意味を維持する', async () => {
    const repo = new LocalVocalMapRepository();
    await repo.clearAll();
    await repo.saveSong(song);
    const reopened = new LocalVocalMapRepository();
    expect((await reopened.getSong('song'))?.lyrics[0].annotations).toEqual([highlight]);
    const parsed = parseImportJson(JSON.stringify(await reopened.exportData()));
    expect(parsed.valid).toBe(true);
    if (!parsed.valid) throw new Error(parsed.message);
    await reopened.clearAll();
    await reopened.importData(parsed.data);
    expect((await reopened.getSong('song'))?.lyrics[0].annotations).toEqual([highlight]);
    expect((await reopened.exportData()).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  test('不正な色分けJSONを拒否し、旧データには着色を追加しない', () => {
    const data = { ...createInitialData(), songs: [song] };
    expect(validateImportData(data).valid).toBe(true);
    for (const invalid of [null, { label: {}, color: '#FFFFFF' }, { label: '裏声', color: 'invalid' }]) {
      const broken = { ...data, songs: [{ ...song, lyrics: [{ ...line, annotations: [{ ...highlight, highlight: invalid }] }] }] };
      expect(validateImportData(broken).valid).toBe(false);
    }
    const migrated = migrateData({ ...data, schemaVersion: 7, songs: [{ ...song, lyrics: [{ ...line, annotations: [symbol] }] }] });
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.songs[0].lyrics[0].annotations).toEqual([symbol]);
  });
});
