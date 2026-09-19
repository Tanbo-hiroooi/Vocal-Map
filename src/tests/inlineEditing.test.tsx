import MapScreen from '@/app/songs/[id]/map';
import { AnnotationEditor } from '@/components/annotations/AnnotationEditor';
import { createPresetSymbols } from '@/constants/presetSymbols';
import { Song } from '@/domain/models';
import { defaultSettings } from '@/storage/migrations';
import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native';
import React, { useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';

const mockRouter = { push: jest.fn(), replace: jest.fn(), dismissTo: jest.fn() };
const mockSave = jest.fn();
const mockUseAppData = jest.fn();
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: 'song' }), useRouter: () => mockRouter }));
jest.mock('@/features/app/AppProvider', () => ({ useAppData: () => mockUseAppData() }));
jest.mock('@/components/common/confirmationDialog', () => ({ confirmAction: async () => true }));

const song: Song = {
  id: 'song', title: '同じ画面で練習', createdAt: '', updatedAt: '',
  lyrics: [
    { id: 'one', text: '君に伝えたい', order: 0, annotations: [] },
    { id: 'two', text: '明日も歌おう', order: 1, annotations: [] },
  ],
};
const originalWindow = Dimensions.get('window');
const originalScreen = Dimensions.get('screen');

describe('歌詞と編集パネルの同時表示', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppData.mockImplementation(function useTestData() {
      const [songs, setSongs] = useState([song]);
      return { songs, symbols: createPresetSymbols(), settings: defaultSettings, loading: false,
        saveSong: async (next: Song) => { mockSave(next); setSongs([next]); }, saveSettings: async () => {},
      };
    });
  });
  afterEach(async () => {
    await act(async () => Dimensions.set({ window: originalWindow, screen: originalScreen }));
  });

  test.each([320, 390, 1280])('%ipxで歌詞を残したまま追加・別行の選択・削除ができる', async (width) => {
    const size = { width, height: 844, scale: 1, fontScale: 1 };
    await act(async () => Dimensions.set({ window: size, screen: size }));
    const view = await render(<MapScreen />);
    await fireEvent.press(view.getByRole('button', { name: '歌詞「君に伝えたい」を選択' }));
    const paneStyle = StyleSheet.flatten(view.getByTestId('map-editor-pane').props.style);
    expect(paneStyle).toMatchObject(width >= 1000 ? { width: 390 } : { height: '46%' });
    const lyrics = within(view.getByTestId('map-lyrics-scroll'));
    expect(lyrics.getByText('明日も歌おう')).toBeTruthy();
    expect(within(view.getByTestId('annotation-editor-scroll')).queryByText('この記号を追加')).toBeNull();
    expect(within(view.getByTestId('annotation-editor-actions')).getByText('この記号を追加')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('3文字目「伝」'));
    await fireEvent.press(view.getByLabelText('6文字目「い」'));
    await fireEvent.press(view.getByText('背景色で歌い方を指定'));
    await fireEvent.press(view.getByLabelText('ミックスで色分け'));
    await fireEvent.press(view.getByText('この色分けを追加'));
    await waitFor(() => expect(lyrics.getByText('ミックス')).toBeTruthy());
    expect(view.getByTestId('annotation-editor')).toBeTruthy();
    await fireEvent.press(lyrics.getByRole('button', { name: '歌詞「明日も歌おう」を選択' }));
    expect(view.getByText('この色分けを追加')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('4文字目「歌」'));
    await fireEvent.press(view.getByLabelText('6文字目「う」'));
    await fireEvent.press(view.getByText('この色分けを追加'));
    await waitFor(() => expect(lyrics.getAllByText('ミックス')).toHaveLength(2));
    expect(mockSave.mock.calls[1][0].lyrics.map((line: Song['lyrics'][number]) => line.annotations.length)).toEqual([1, 1]);
    await fireEvent.press(view.getByText('ミックスの色分けを削除（歌おう）'));
    await waitFor(() => expect(lyrics.getAllByText('ミックス')).toHaveLength(1));
    expect(view.getByTestId('annotation-editor')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: '閉じる' }));
    expect(view.queryByTestId('map-editor-pane')).toBeNull();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('同じ行をドラッグし直しても歌い方の設定を維持して範囲を変更できる', async () => {
    const save = jest.fn();
    const view = await render(<AnnotationEditor visible line={song.lyrics[0]} symbols={[]} initialRange={{ start: 0, end: 2 }} onSave={save} onClose={() => {}} />);
    await fireEvent.press(view.getByText('背景色で歌い方を指定'));
    await fireEvent.press(view.getByLabelText('ミックスで色分け'));
    await view.rerender(<AnnotationEditor visible line={song.lyrics[0]} symbols={[]} initialRange={{ start: 2, end: 6 }} onSave={save} onClose={() => {}} />);
    await fireEvent.press(view.getByText('この色分けを追加'));
    expect(save.mock.calls[0][0]).toMatchObject({ range: { start: 2, end: 6 }, highlight: { label: 'ミックス' } });
  });

  test('保存失敗時は入力を保持し、連打で保存を重複させない', async () => {
    let rejectSave!: (error: Error) => void;
    const save = jest.fn(() => new Promise<void>((_, reject) => { rejectSave = reject; }));
    const close = jest.fn();
    const view = await render(<AnnotationEditor visible line={song.lyrics[0]} symbols={createPresetSymbols()} initialRange={{ start: 0, end: 2 }} onSave={save} onClose={close} />);
    await fireEvent.press(view.getByText('この記号を追加'));
    await fireEvent.press(view.getByRole('button', { name: 'この記号を追加' }));
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => rejectSave(new Error('storage full')));
    expect(view.getByRole('alert')).toBeTruthy();
    expect(view.getByText(/選択中：.*君に/)).toBeTruthy();
    expect(close).not.toHaveBeenCalled();
  });
});
