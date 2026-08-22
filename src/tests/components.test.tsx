import { AnnotationEditor } from '@/components/annotations/AnnotationEditor';
import { VocalLine } from '@/components/annotations/VocalLine';
import { SymbolEditor } from '@/components/symbols/SymbolEditor';
import { createPresetSymbols } from '@/constants/presetSymbols';
import { LyricLine, Song } from '@/domain/models';
import { SongForm } from '@/features/songs/SongForm';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

const line: LyricLine = { id: 'line', text: '君に伝えたい', order: 0, annotations: [] };
describe('主要コンポーネント', () => {
  test('曲一覧の内容を表示できる', async () => {
    const songs: Song[] = [{ id: '1', title: 'テスト曲', artist: '歌手', lyrics: [], createdAt: '', updatedAt: '' }];
    const List = () => <>{songs.map((song) => <VocalLine key={song.id} line={{ id: song.id, text: `${song.title} / ${song.artist}`, order: 0, annotations: [] }} symbols={[]} editing={false} />)}</>;
    const view = await render(<List />); expect(view.getByText('テスト曲 / 歌手')).toBeTruthy();
  });
  test('新規曲を保存できる', async () => {
    const save = jest.fn(async (_song: Song) => {}); const view = await render(<SongForm onSave={save} />);
    await fireEvent.changeText(view.getByPlaceholderText('例：練習曲'), '新しい曲'); await fireEvent.changeText(view.getByPlaceholderText('歌詞を入力または貼り付け'), '一行目\n二行目'); await fireEvent.press(view.getByText('保存する'));
    await waitFor(() => expect(save).toHaveBeenCalled()); expect(save.mock.calls[0][0].lyrics).toHaveLength(2);
  });
  test('選択した語句へ記号を追加できる', async () => {
    const save = jest.fn(); const symbols = createPresetSymbols(); const view = await render(<AnnotationEditor visible line={line} symbols={symbols} onClose={() => {}} onSave={save} />);
    await fireEvent.press(view.getByLabelText('3文字目「伝」')); await fireEvent.press(view.getByLabelText('6文字目「い」')); await fireEvent.press(view.getByText('この記号を追加')); expect(save).toHaveBeenCalled(); expect(save.mock.calls[0][0].targetType).toBe('range'); expect(save.mock.calls[0][0].range).toEqual({ start: 2, end: 6 }); expect(save.mock.calls[0][0].position).toBe('above');
  });
  test('歌詞画面で選択した範囲を引き継いで記号を追加できる', async () => {
    const save = jest.fn(); const view = await render(<AnnotationEditor visible line={line} symbols={createPresetSymbols()} initialRange={{ start: 2, end: 6 }} onClose={() => {}} onSave={save} />);
    expect(view.getByText(/選択中：.*伝えたい/)).toBeTruthy(); await fireEvent.press(view.getByText('この記号を追加')); expect(save.mock.calls[0][0].range).toEqual({ start: 2, end: 6 }); expect(save.mock.calls[0][0].targetTextSnapshot).toBe('伝えたい');
  });
  test('語句ごとに同じ高さの記号レーンを確保する', async () => {
    const symbols = createPresetSymbols(); const annotated: LyricLine = { ...line, annotations: [{ id: 'a', symbolId: symbols[0].id, position: 'below', targetType: 'range', range: { start: 2, end: 6 }, targetTextSnapshot: '伝えたい', status: 'valid', createdAt: '', updatedAt: '' }] }; const view = await render(<VocalLine line={annotated} symbols={symbols} editing={false} />); expect(view.getAllByTestId('range-marker-lane')).toHaveLength(2); expect(view.getByText(symbols[0].symbol)).toBeTruthy(); expect(StyleSheet.flatten(view.getByText('伝えたい').props.style)?.backgroundColor).toBeUndefined();
  });
  test('統合画面では歌詞タップで編集を開ける', async () => {
    const select = jest.fn(); const view = await render(<VocalLine line={line} symbols={[]} editing={false} onPress={select} />); expect(view.queryByText('＋ 記号追加')).toBeNull(); await fireEvent.press(view.getByRole('button', { name: '歌詞「君に伝えたい」を選択' })); expect(select).toHaveBeenCalled();
  });
  test('カスタム記号を作成できる', async () => {
    const save = jest.fn(); const view = await render(<SymbolEditor visible onClose={() => {}} onSave={save} />);
    await fireEvent.changeText(view.getByPlaceholderText('↑、♪、Mixなど'), '響'); await fireEvent.changeText(view.getByPlaceholderText('例：響きを集める'), '響きを集める'); await fireEvent.press(view.getByText('保存する'));
    expect(save).toHaveBeenCalled(); expect(save.mock.calls[0][0].isPreset).toBe(false);
  });
});
