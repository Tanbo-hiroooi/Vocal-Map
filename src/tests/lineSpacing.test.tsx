import SettingsScreen from '@/app/(tabs)/settings';
import EditSongScreen from '@/app/songs/[id]/edit';
import MapScreen from '@/app/songs/[id]/map';
import { AppSettings, Song } from '@/domain/models';
import { LocalVocalMapRepository } from '@/repositories/LocalVocalMapRepository';
import { storage } from '@/storage/storage';
import { fireEvent, render, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import { AppState, StyleSheet } from 'react-native';

const mockSaveSettings = jest.fn(async (_settings: AppSettings) => {});
const mockSaveSong = jest.fn(async (_song: Song) => {});
const mockUseAppData = jest.fn();
const mockRouter = { push: jest.fn(), replace: jest.fn(), dismissTo: jest.fn() };
const initialAppState = AppState.currentState;

jest.mock('@/features/app/AppProvider', () => ({ useAppData: () => mockUseAppData() }));
jest.mock('@/storage/storage', () => {
  const values = new Map<string, string>();
  return { storage: {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: jest.fn(async (key: string, value: string) => { values.set(key, value); }),
    removeItem: async (key: string) => { values.delete(key); },
  } };
});
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'song-1' }),
  useRouter: () => mockRouter,
  useFocusEffect: (effect: () => void) => jest.requireActual('react').useEffect(effect, [effect]),
  Stack: { Screen: ({ options }: { options: { headerRight?(): React.ReactNode } }) => options.headerRight?.() ?? null },
}));

const settings: AppSettings = {
  defaultFontSize: 18,
  practiceFontSize: 28,
  lyricLineSpacing: 6,
  autoScrollSpeed: 3,
  colorScheme: 'system',
};
const song: Song = {
  id: 'song-1',
  title: '行間確認',
  lyrics: [
    { id: 'line-1', text: '一行目', order: 0, annotations: [] },
    { id: 'line-2', text: '二行目', order: 1, annotations: [] },
  ],
  createdAt: '2026-08-30T00:00:00.000Z',
  updatedAt: '2026-08-30T00:00:00.000Z',
};

describe('歌詞画面の設定とナビゲーション', () => {
  beforeEach(() => {
    AppState.currentState = 'active';
    jest.clearAllMocks();
    mockSaveSettings.mockImplementation(async () => {});
    mockUseAppData.mockReturnValue({
      songs: [song], symbols: [], settings, loading: false,
      saveSong: mockSaveSong, saveSettings: mockSaveSettings,
      refresh: jest.fn(), saveSymbol: jest.fn(), deleteSong: jest.fn(), deleteSymbol: jest.fn(),
    });
  });
  afterEach(() => { AppState.currentState = initialAppState; });

  test('歌詞画面で行間を広げて保存できる', async () => {
    const view = await render(<MapScreen />);
    expect(StyleSheet.flatten(view.getByTestId('lyric-lines').props.style).gap).toBe(6);

    await fireEvent.press(view.getByLabelText('歌詞の行間を広くする'));

    expect(StyleSheet.flatten(view.getByTestId('lyric-lines').props.style).gap).toBe(8);
    await waitFor(() => expect(mockSaveSettings).toHaveBeenCalledWith({ ...settings, lyricLineSpacing: 8 }));
  });

  test('設定画面から好みの行間へ変更できる', async () => {
    const view = await render(<SettingsScreen />);
    expect(view.getByText('歌詞の行間')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('歌詞の行間を狭くする'));

    await waitFor(() => expect(mockSaveSettings).toHaveBeenCalledWith({ ...settings, lyricLineSpacing: 4 }));
  });

  test('文字サイズと行間を続けて変更しても両方を保存し、再度開いた画面に復元する', async () => {
    const repository = new LocalVocalMapRepository();
    await repository.saveSettings(settings);
    mockSaveSettings.mockImplementation((next) => repository.saveSettings(next));
    const view = await render(<MapScreen />);

    await fireEvent.press(view.getByLabelText('歌詞の文字を小さくする'));
    await fireEvent.press(view.getByLabelText('歌詞の行間を広くする'));
    await fireEvent.press(view.getByLabelText('歌詞の文字を小さくする'));
    await fireEvent.press(view.getByLabelText('歌詞の行間を広くする'));
    await Promise.all(mockSaveSettings.mock.results.map((result) => result.value));
    await view.unmount();

    const restored = await new LocalVocalMapRepository().getSettings();
    expect(restored).toEqual({ ...settings, practiceFontSize: 24, lyricLineSpacing: 10 });
    expect(mockSaveSettings.mock.calls[1][0]).toMatchObject({ practiceFontSize: 26, lyricLineSpacing: 8 });
    mockUseAppData.mockReturnValue({ ...mockUseAppData(), settings: restored });
    const reopened = await render(<MapScreen />);
    expect(reopened.getByTestId('lyric-font-size').props.children).toBe(24);
    expect(StyleSheet.flatten(reopened.getByTestId('lyric-lines').props.style).gap).toBe(10);
  });

  test('文字サイズの保存失敗を日本語で知らせる', async () => {
    mockSaveSettings.mockRejectedValueOnce(new Error('Storage full'));
    const view = await render(<MapScreen />);
    await fireEvent.press(view.getByLabelText('歌詞の文字を大きくする'));
    await waitFor(() => expect(view.getByRole('alert').props.children).toBe('文字サイズ・行間を保存できませんでした。もう一度変更してお試しください。'));
  });

  test('速度・文字・行間を続けて変更して保存し、再起動とJSON復元でも速度を保持する', async () => {
    const repository = new LocalVocalMapRepository();
    await repository.saveSettings(settings);
    mockSaveSettings.mockImplementation((next) => repository.saveSettings(next));
    const view = await render(<MapScreen />);
    expect(view.queryByTestId('auto-scroll-controls')).toBeNull();
    expect(view.queryByTestId('auto-scroll-collapsed')).toBeNull();
    expect(within(view.getByTestId('map-workspace')).queryByTestId('auto-scroll-header-actions')).toBeNull();
    await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを開く'));
    expect(StyleSheet.flatten(view.getByTestId('auto-scroll-popover').props.style)).toMatchObject({ position: 'absolute', top: 8, right: 12 });
    expect(view.getByLabelText('スクロール速度 3、10段階')).toBeTruthy();
    expect(within(view.getByTestId('map-lyrics-scroll')).queryByTestId('auto-scroll-controls')).toBeNull();
    await fireEvent.press(view.getByLabelText('自動スクロールを速くする'));
    await fireEvent.press(view.getByLabelText('歌詞の文字を小さくする'));
    await fireEvent.press(view.getByLabelText('歌詞の行間を広くする'));
    await fireEvent.press(view.getByLabelText('自動スクロールを速くする'));
    await Promise.all(mockSaveSettings.mock.results.map((result) => result.value));
    await view.unmount();
    const backup = JSON.parse(JSON.stringify(await new LocalVocalMapRepository().exportData()));
    expect(backup.settings).toEqual({ ...settings, autoScrollSpeed: 5, practiceFontSize: 26, lyricLineSpacing: 8 });
    await repository.clearAll(); await repository.importData(backup);
    const restored = await new LocalVocalMapRepository().getSettings();
    mockUseAppData.mockReturnValue({ ...mockUseAppData(), settings: restored });
    const reopened = await render(<MapScreen />);
    await fireEvent.press(reopened.getByLabelText('自動スクロールの操作パネルを開く'));
    expect(reopened.getByLabelText('スクロール速度 5、10段階')).toBeTruthy();
    expect(reopened.queryByLabelText('自動スクロールを停止')).toBeNull();
  });

  test('速度の保存失敗を表示し、変更をやり直せる', async () => {
    mockSaveSettings.mockRejectedValueOnce(new Error('Storage full'));
    const view = await render(<MapScreen />);
    await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを開く'));
    await fireEvent.press(view.getByLabelText('自動スクロールを速くする'));
    await waitFor(() => expect(view.getByRole('alert')).toHaveTextContent(/スクロール速度を保存できませんでした/));
    await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを閉じる'));
    expect(view.queryByTestId('auto-scroll-popover')).toBeNull();
    expect(view.getByRole('alert')).toHaveTextContent(/スクロール速度を保存できませんでした/);
    await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを開く'));
    await fireEvent.press(view.getByLabelText('自動スクロールを遅くする'));
    expect(mockSaveSettings).toHaveBeenLastCalledWith(settings);
    await waitFor(() => expect(view.queryByRole('alert')).toBeNull());
  });

  test('歌詞画面で開始・停止でき、歌詞の編集や手動スクロールで停止する', async () => {
    jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1);
    jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    try {
      const view = await render(<MapScreen />);
      await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを開く'));
      expect(view.getByLabelText('自動スクロールを開始')).toBeDisabled();
      const scroll = view.getByTestId('map-lyrics-scroll');
      await fireEvent(scroll, 'layout', { nativeEvent: { layout: { height: 400, width: 320 } } });
      await fireEvent(scroll, 'contentSizeChange', 320, 1800);
      await fireEvent.press(view.getByLabelText('自動スクロールを開始'));
      expect(view.getByLabelText('自動スクロールをすぐ停止')).toBeTruthy();
      expect(view.queryByTestId('auto-scroll-popover')).toBeNull();
      await fireEvent.press(view.getByLabelText('1文字目「一」'));
      expect(view.queryByLabelText('自動スクロールをすぐ停止')).toBeNull();
      await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを開く'));
      await fireEvent.press(view.getByLabelText('自動スクロールを開始'));
      await fireEvent(scroll, 'scrollBeginDrag');
      expect(view.queryByLabelText('自動スクロールをすぐ停止')).toBeNull();
      await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを開く'));
      await fireEvent.press(view.getByLabelText('自動スクロールを開始'));
      await fireEvent(view.getByTestId('practice-scroll-area'), 'touchStart');
      expect(view.queryByLabelText('自動スクロールをすぐ停止')).toBeNull();
      await view.unmount();
    } finally { jest.restoreAllMocks(); }
  });

  test('実ストレージへの書き込みが一度失敗しても、再保存で回復する', async () => {
    const repository = new LocalVocalMapRepository();
    await repository.saveSettings(settings);
    jest.mocked(storage.setItem).mockRejectedValueOnce(new Error('Storage full'));
    await expect(repository.saveSettings({ ...settings, autoScrollSpeed: 4 })).rejects.toThrow('Storage full');
    expect((await repository.getSettings()).autoScrollSpeed).toBe(3);
    await repository.saveSettings({ ...settings, autoScrollSpeed: 5 });
    expect((await repository.getSettings()).autoScrollSpeed).toBe(5);
  });

  test('実行中にパネルを閉じると停止し、再表示しても停止状態を保つ', async () => {
    jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1);
    const cancel = jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    try {
      const view = await render(<MapScreen />);
      await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを開く'));
      const scroll = view.getByTestId('map-lyrics-scroll');
      await fireEvent(scroll, 'layout', { nativeEvent: { layout: { height: 400, width: 320 } } });
      await fireEvent(scroll, 'contentSizeChange', 320, 1800);
      await fireEvent.press(view.getByLabelText('自動スクロールを開始'));
      expect(view.getByLabelText('自動スクロールをすぐ停止')).toBeTruthy();
      await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを開く'));
      await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを閉じる'));
      expect(cancel).toHaveBeenCalled();
      expect(view.queryByLabelText('自動スクロールをすぐ停止')).toBeNull();
      await fireEvent.press(view.getByLabelText('自動スクロールの操作パネルを開く'));
      expect(view.getByLabelText('自動スクロールを開始')).toBeTruthy();
      expect(view.getByLabelText('スクロール速度 3、10段階')).toBeTruthy();
      expect(mockSaveSettings).not.toHaveBeenCalled();
      await view.unmount();
    } finally { jest.restoreAllMocks(); }
  });

  test('歌詞画面から履歴に依存せず曲一覧へ戻れる', async () => {
    const view = await render(<MapScreen />);

    await fireEvent.press(view.getByLabelText('曲一覧へ戻る'));

    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/');
  });

  test('曲情報の保存後は同じ画面を重ねず元の歌詞画面へ戻る', async () => {
    const view = await render(<EditSongScreen />);

    await fireEvent.press(view.getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(mockSaveSong).toHaveBeenCalled());
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/songs/song-1/map');
  });
});
