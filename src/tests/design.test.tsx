import { NavigationButton } from '@/components/navigation/NavigationButton';
import { EmptySongs } from '@/components/songs/EmptySongs';
import { SongCard } from '@/components/songs/SongCard';
import { Song } from '@/domain/models';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import * as ReactNative from 'react-native';

const initialWindow = ReactNative.Dimensions.get('window');
const initialScreen = ReactNative.Dimensions.get('screen');

describe('ポップなUIの基本操作', () => {
  afterEach(async () => {
    await act(async () => ReactNative.Dimensions.set({ window: initialWindow, screen: initialScreen }));
  });

  test('ナビゲーションは選択状態とラベルを伝え、タップできる', async () => {
    const onPress = jest.fn();
    const view = await render(<NavigationButton label="曲" icon="♫" tone="coral" isFocused accessibilityLabel="曲一覧" onPress={onPress} />);
    const tab = view.getByRole('tab', { name: '曲一覧', selected: true });
    expect(ReactNative.StyleSheet.flatten(tab.props.style).minHeight).toBeGreaterThanOrEqual(44);
    await fireEvent.press(tab);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test.each([320, 390, 1024])('%ipx幅でも曲登録ボタンが操作できる', async (width) => {
    const dimensions = { width, height: 844, scale: 1, fontScale: 1 };
    await act(async () => ReactNative.Dimensions.set({ window: dimensions, screen: dimensions }));
    const onCreate = jest.fn();
    const view = await render(<EmptySongs onCreate={onCreate} />);
    await fireEvent.press(view.getByRole('button', { name: '曲を登録' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(view.queryByText('最初の曲を作る')).toBeNull();
  });

  test('曲カードに曲の情報を表示し、既存の操作を維持する', async () => {
    const song: Song = { id: 'song-1', title: '練習用の曲', artist: '自分', lyrics: [], createdAt: '2026-08-27T00:00:00.000Z', updatedAt: '2026-08-27T00:00:00.000Z' };
    const onOpen = jest.fn(); const onEdit = jest.fn(); const onDelete = jest.fn();
    const view = await render(<SongCard song={song} index={0} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />);
    expect(view.getByText('練習用の曲')).toBeTruthy();
    expect(view.getByText('自分')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: '開く →' }));
    await fireEvent.press(view.getByRole('button', { name: '編集' }));
    await fireEvent.press(view.getByRole('button', { name: '削除' }));
    expect(onOpen).toHaveBeenCalledTimes(1); expect(onEdit).toHaveBeenCalledTimes(1); expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
