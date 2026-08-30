import SettingsScreen from '@/app/(tabs)/settings';
import MapScreen from '@/app/songs/[id]/map';
import { AppSettings, Song } from '@/domain/models';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

const mockSaveSettings = jest.fn(async (_settings: AppSettings) => {});
const mockUseAppData = jest.fn();
const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock('@/features/app/AppProvider', () => ({ useAppData: () => mockUseAppData() }));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'song-1' }),
  useRouter: () => mockRouter,
}));

const settings: AppSettings = {
  defaultFontSize: 18,
  practiceFontSize: 28,
  lyricLineSpacing: 6,
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

describe('歌詞の行間設定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppData.mockReturnValue({
      songs: [song], symbols: [], settings, loading: false,
      saveSong: jest.fn(), saveSettings: mockSaveSettings,
      refresh: jest.fn(), saveSymbol: jest.fn(), deleteSong: jest.fn(), deleteSymbol: jest.fn(),
    });
  });

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
});
