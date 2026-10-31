import MapScreen from '@/app/songs/[id]/map';
import { QuickAnnotationToolbar } from '@/components/annotations/QuickAnnotationToolbar';
import { createPresetSymbols } from '@/constants/presetSymbols';
import { Song } from '@/domain/models';
import { defaultSettings } from '@/storage/migrations';
import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native';
import React, { useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';

const mockRouter = { push: jest.fn(), replace: jest.fn(), dismissTo: jest.fn() };
const mockSave = jest.fn();
const mockUseAppData = jest.fn();
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: 'song' }), useRouter: () => mockRouter, useFocusEffect: (effect: () => void) => jest.requireActual('react').useEffect(effect, [effect]) }));
jest.mock('@/features/app/AppProvider', () => ({ useAppData: () => mockUseAppData() }));
jest.mock('@/components/common/confirmationDialog', () => ({ confirmAction: async () => true }));
const song: Song = { id: 'song', title: '同じ画面で練習', createdAt: '', updatedAt: '', lyrics: [
  { id: 'one', text: '君に伝えたい', order: 0, annotations: [] },
  { id: 'two', text: '明日も歌おう', order: 1, annotations: [] },
] };
const originalWindow = Dimensions.get('window');
const originalScreen = Dimensions.get('screen');

describe('歌詞上での直接編集', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppData.mockImplementation(function useTestData() {
      const [songs, setSongs] = useState([song]);
      return { songs, symbols: createPresetSymbols(), settings: defaultSettings, loading: false,
        saveSong: async (next: Song) => { mockSave(next); setSongs([next]); }, saveSettings: async () => {},
      };
    });
  });
  afterEach(async () => { await act(async () => Dimensions.set({ window: originalWindow, screen: originalScreen })); });

  test.each([320, 390, 1280])('%ipxで歌詞を選び、色分けの追加・変更・削除まで行える', async (width) => {
    const size = { width, height: 844, scale: 1, fontScale: 1 };
    await act(async () => Dimensions.set({ window: size, screen: size }));
    const view = await render(<MapScreen />);
    const first = within(view.getByTestId('lyric-line-one'));
    await fireEvent.press(first.getByLabelText('3文字目「伝」'));
    expect(first.getByTestId('quick-annotation-toolbar')).toBeTruthy();
    expect(view.queryByTestId('map-editor-pane')).toBeNull();
    expect(view.queryByTestId('annotation-editor')).toBeNull();
    expect(view.getByTestId('lyric-line-two')).toBeTruthy();
    await fireEvent.press(view.getByText('色分け', { exact: true }));
    await fireEvent.press(first.getByLabelText('6文字目「い」'));
    await fireEvent.press(view.getByLabelText('ミックスで色分け'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave.mock.calls[0][0].lyrics[0].annotations[0]).toMatchObject({ range: { start: 2, end: 6 }, highlight: { label: 'ミックス' } });
    await fireEvent.press(view.getByRole('button', { name: '閉じる' }));
    await fireEvent.press(first.getByLabelText('ミックスの色分けを編集'));
    expect(view.getByText('選択中：「伝えたい」を変更')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('裏声で色分け'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));
    expect(mockSave.mock.calls[1][0].lyrics[0].annotations).toHaveLength(1);
    expect(mockSave.mock.calls[1][0].lyrics[0].annotations[0].highlight.label).toBe('裏声');
    await fireEvent.press(view.getByLabelText('選択した記号・色分けを削除'));
    await waitFor(() => expect(mockSave.mock.calls[2][0].lyrics[0].annotations).toHaveLength(0));
    expect(view.queryByTestId('quick-annotation-toolbar')).toBeNull();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('色分けを残して記号を併用し、文字間のブレスをその場で変更できる', async () => {
    const view = await render(<MapScreen />);
    const first = within(view.getByTestId('lyric-line-one'));
    await fireEvent.press(first.getByLabelText('1文字目「君」'));
    await fireEvent.press(view.getByText('色分け', { exact: true }));
    await fireEvent.press(first.getByLabelText('2文字目「に」'));
    await fireEvent.press(view.getByLabelText('裏声で色分け'));
    await fireEvent.press(view.getByText('記号', { exact: true }));
    await fireEvent.press(view.getByLabelText('上に抜くを付ける'));
    expect(mockSave.mock.calls[1][0].lyrics[0].annotations).toHaveLength(2);
    await fireEvent.press(view.getByText('ブレス', { exact: true }));
    await fireEvent.press(view.getByLabelText('ブレスを付ける'));
    expect(mockSave.mock.calls[2][0].lyrics[0].annotations).toHaveLength(3);
    expect(mockSave.mock.calls[1][0].lyrics[0].annotations[1]).toMatchObject({ range: { start: 0, end: 1 } });
    expect(mockSave.mock.calls[2][0].lyrics[0].annotations[2]).toMatchObject({ targetType: 'boundary', boundary: { index: 1 } });
    await fireEvent.press(view.getByText('閉じる'));
    await fireEvent.press(first.getByLabelText('ブレス、文字の間を編集'));
    await fireEvent.press(view.getByLabelText('短いブレスを付ける'));
    expect(mockSave.mock.calls[3][0].lyrics[0].annotations).toHaveLength(3);
  });

  test('色分けの範囲を歌詞上で選び直して更新できる', async () => {
    const view = await render(<MapScreen />);
    const first = within(view.getByTestId('lyric-line-one'));
    await fireEvent.press(first.getByLabelText('1文字目「君」'));
    await fireEvent.press(view.getByText('色分け', { exact: true }));
    await fireEvent.press(first.getByLabelText('2文字目「に」'));
    await fireEvent.press(view.getByLabelText('裏声で色分け'));
    await fireEvent.press(view.getByLabelText('範囲を選び直す'));
    await fireEvent.press(first.getByLabelText('1文字目「君」'));
    await fireEvent.press(first.getByLabelText('3文字目「伝」'));
    await fireEvent.press(view.getByLabelText('ミックスで色分け'));
    expect(mockSave.mock.calls[1][0].lyrics[0].annotations).toHaveLength(1);
    expect(mockSave.mock.calls[1][0].lyrics[0].annotations[0].range).toEqual({ start: 0, end: 3 });
  });

  test('保存失敗時は選択を保持し、連打で保存を重複させない', async () => {
    let rejectSave!: (error: Error) => void;
    const save = jest.fn(() => new Promise<void>((_, reject) => { rejectSave = reject; }));
    const view = await render(<QuickAnnotationToolbar line={song.lyrics[0]} symbols={createPresetSymbols()} mode="symbol" onModeChange={() => {}} range={{ start: 0, end: 2 }} onSave={save} onDelete={async () => {}} onClose={() => {}} onReselect={() => {}} />);
    await fireEvent.press(view.getByLabelText('上に抜くを付ける'));
    await fireEvent.press(view.getByLabelText('上に抜くを付ける'));
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => rejectSave(new Error('保存できませんでした。')));
    expect(view.getByRole('alert')).toBeTruthy();
    expect(view.getByText('選択中：「君に」')).toBeTruthy();
  });

  test('1回のタップで編集欄を開き、色分けを選んだ場合だけ末尾を指定する', async () => {
    const view = await render(<MapScreen />);
    const first = within(view.getByTestId('lyric-line-one'));
    expect(first.getByLabelText('3文字目「伝」').props.onLongPress).toBeUndefined();
    await fireEvent.press(first.getByLabelText('2文字目「に」'));
    expect(view.getByTestId('quick-annotation-toolbar')).toBeTruthy();
    expect(view.getByText('選択中：「に」')).toBeTruthy();
    expect(first.getAllByTestId('selection-character-underline')).toHaveLength(1);
    expect(StyleSheet.flatten(first.getByText('に', { exact: true }).props.style).textDecorationLine).toBeUndefined();
    expect(StyleSheet.flatten(first.getByTestId('selection-character-underline').props.style)).toMatchObject({ borderBottomWidth: 2 });
    await fireEvent.press(view.getByText('色分け', { exact: true }));
    expect(view.getByLabelText('裏声で色分け')).toBeDisabled();
    await fireEvent.press(first.getByLabelText('4文字目「え」'));
    expect(view.getByText('選択中：「に伝え」')).toBeTruthy();
    expect(view.queryByTestId('selection-adjustments')).toBeNull();
    expect(view.queryByLabelText('先頭を1文字前へ')).toBeNull();
    expect(view.getByLabelText('裏声で色分け')).toBeEnabled();
    await fireEvent.press(view.getByLabelText('裏声で色分け'));
    expect(mockSave.mock.calls[0][0].lyrics[0].annotations[0]).toMatchObject({ range: { start: 1, end: 4 }, targetTextSnapshot: 'に伝え' });
  });

  test('1回タップで文字を選び、ブレスは必ずその直後に置く', async () => {
    const view = await render(<MapScreen />);
    const first = within(view.getByTestId('lyric-line-one'));
    await fireEvent.press(first.getByLabelText('1文字目「君」'));
    expect(view.getByText('選択中：「君」')).toBeTruthy();
    await fireEvent.press(view.getByText('ブレス', { exact: true }));
    expect(view.queryByText('選んだ文字の前')).toBeNull();
    expect(view.queryByText('選んだ文字の後')).toBeNull();
    await fireEvent.press(view.getByLabelText('ブレスを付ける'));
    expect(mockSave.mock.calls[0][0].lyrics[0].annotations[0]).toMatchObject({ targetType: 'boundary', boundary: { index: 1 } });
  });

  test('行頭ブレスは専用ボタンで位置を指定し、変更しても行頭のまま保存する', async () => {
    const view = await render(<MapScreen />);
    const first = within(view.getByTestId('lyric-line-one'));
    await fireEvent.press(first.getByLabelText('1文字目「君」'));
    await fireEvent.press(view.getByText('ブレス', { exact: true }));
    await fireEvent.press(view.getByLabelText('行頭にブレスを置く'));
    expect(view.getByText('選択中：行頭')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('ブレスを付ける'));
    expect(mockSave.mock.calls[0][0].lyrics[0].annotations[0]).toMatchObject({ targetType: 'boundary', boundary: { index: 0 } });
    await fireEvent.press(view.getByLabelText('短いブレスを付ける'));
    expect(mockSave.mock.calls[1][0].lyrics[0].annotations).toHaveLength(1);
    expect(mockSave.mock.calls[1][0].lyrics[0].annotations[0].boundary.index).toBe(0);
    await fireEvent.press(first.getByLabelText('6文字目「い」'));
    await fireEvent.press(view.getByRole('radio', { name: 'ブレス' }));
    await fireEvent.press(view.getByLabelText('ブレスを付ける'));
    expect(mockSave.mock.calls[2][0].lyrics[0].annotations).toHaveLength(2);
    expect(mockSave.mock.calls[2][0].lyrics[0].annotations[1].boundary.index).toBe(6);
  });

  test('色分けは逆順の範囲選択や、色付き文字からの再選択もできる', async () => {
    const view = await render(<MapScreen />);
    const first = within(view.getByTestId('lyric-line-one'));
    await fireEvent.press(first.getByLabelText('6文字目「い」'));
    await fireEvent.press(view.getByText('色分け', { exact: true }));
    await fireEvent.press(first.getByLabelText('3文字目「伝」'));
    await fireEvent.press(view.getByLabelText('裏声で色分け'));
    await fireEvent.press(view.getByText('閉じる'));
    await fireEvent.press(first.getByLabelText('3文字目「伝」'));
    expect(view.getByText('選択中：「伝」')).toBeTruthy();
    await fireEvent.press(view.getByText('色分け', { exact: true }));
    await fireEvent.press(first.getByLabelText('6文字目「い」'));
    expect(view.getByText('選択中：「伝えたい」')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('ミックスで色分け'));
    expect(mockSave.mock.calls[1][0].lyrics[0].annotations).toHaveLength(1);
  });

  test('別の行へのタップでも1文字の編集欄がすぐ開き、閉じることもできる', async () => {
    const view = await render(<MapScreen />);
    await fireEvent.press(within(view.getByTestId('lyric-line-one')).getByLabelText('3文字目「伝」'));
    const second = within(view.getByTestId('lyric-line-two'));
    await fireEvent.press(second.getByLabelText('2文字目「日」'));
    expect(second.getByTestId('quick-annotation-toolbar')).toBeTruthy();
    expect(view.getByText('選択中：「日」')).toBeTruthy();
    expect(second.getAllByTestId('selection-character-underline')).toHaveLength(1);
    await fireEvent.press(view.getByText('閉じる'));
    expect(view.queryByTestId('quick-annotation-toolbar')).toBeNull();
    expect(view.queryByTestId('selection-character-underline')).toBeNull();
    expect(mockSave).not.toHaveBeenCalled();
  });

  test('記号モードで別の文字をタップしても複数文字の範囲にはならない', async () => {
    const view = await render(<MapScreen />);
    const first = within(view.getByTestId('lyric-line-one'));
    await fireEvent.press(first.getByLabelText('1文字目「君」'));
    expect(view.queryByLabelText('範囲を選び直す')).toBeNull();
    await fireEvent.press(first.getByLabelText('3文字目「伝」'));
    expect(view.getByText('選択中：「伝」')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('上に抜くを付ける'));
    expect(mockSave.mock.calls[0][0].lyrics[0].annotations[0]).toMatchObject({ range: { start: 2, end: 3 } });
  });

  test('1文字の色分けを明示的に確定でき、選択だけでは保存しない', async () => {
    const view = await render(<MapScreen />);
    const first = within(view.getByTestId('lyric-line-one'));
    await fireEvent.press(first.getByLabelText('3文字目「伝」'));
    await fireEvent.press(view.getByText('色分け', { exact: true }));
    await fireEvent.press(view.getByLabelText('裏声で色分け'));
    expect(mockSave).not.toHaveBeenCalled();
    await fireEvent.press(view.getByLabelText('選択中の1文字で色分け範囲を確定'));
    await fireEvent.press(view.getByLabelText('裏声で色分け'));
    expect(mockSave.mock.calls[0][0].lyrics[0].annotations[0]).toMatchObject({ range: { start: 2, end: 3 }, highlight: { label: '裏声' } });
  });

  test('色分けの末尾選択中でも記号・ブレスへ切り替えると1文字だけが対象になる', async () => {
    const view = await render(<MapScreen />);
    const first = within(view.getByTestId('lyric-line-one'));
    await fireEvent.press(first.getByLabelText('2文字目「に」'));
    await fireEvent.press(view.getByText('色分け', { exact: true }));
    await fireEvent.press(view.getByText('記号', { exact: true }));
    expect(view.getByLabelText('上に抜くを付ける')).toBeEnabled();
    await fireEvent.press(view.getByLabelText('上に抜くを付ける'));
    expect(mockSave.mock.calls[0][0].lyrics[0].annotations[0].range).toEqual({ start: 1, end: 2 });
    await fireEvent.press(view.getByText('色分け', { exact: true }));
    await fireEvent.press(first.getByLabelText('6文字目「い」'));
    await fireEvent.press(view.getByText('ブレス', { exact: true }));
    expect(view.getByText('選択中：「に」を変更')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('ブレスを付ける'));
    expect(mockSave.mock.calls[1][0].lyrics[0].annotations[1].boundary.index).toBe(2);
  });
});
