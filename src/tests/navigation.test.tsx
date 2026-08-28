import { AppTabs } from '@/components/navigation/AppTabs.web';
import { act, fireEvent, renderRouter } from 'expo-router/testing-library';
import React from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';

const initialWindow = Dimensions.get('window');
const initialScreen = Dimensions.get('screen');

describe('Webの上部ナビゲーション', () => {
  afterEach(async () => {
    await act(async () => Dimensions.set({ window: initialWindow, screen: initialScreen }));
  });
  test.each([320, 390, 1280])('%ipx幅で曲・記号・設定を切り替えられる', async (width) => {
    const dimensions = { width, height: 844, scale: 1, fontScale: 1 };
    await act(async () => Dimensions.set({ window: dimensions, screen: dimensions }));
    const result = renderRouter({
      _layout: AppTabs,
      index: () => <Text>曲一覧ページ</Text>,
      symbols: () => <Text>記号辞書ページ</Text>,
      settings: () => <Text>設定ページ</Text>,
    }, { initialUrl: '/' });
    const view = await result;
    expect(view.getByTestId('primary-navigation')).toBeTruthy();
    expect(StyleSheet.flatten(view.getByTestId('primary-navigation').props.style).width).toBeLessThan(width);
    expect(view.getByRole('tab', { name: '曲一覧', selected: true })).toBeTruthy();
    await fireEvent.press(view.getByRole('tab', { name: '記号辞書' }));
    expect(view.getByText('記号辞書ページ')).toBeTruthy();
    expect(view.getByRole('tab', { name: '記号辞書', selected: true })).toBeTruthy();
    await fireEvent.press(view.getByRole('tab', { name: '設定' }));
    expect(view.getByText('設定ページ')).toBeTruthy();
    expect(view.getByRole('tab', { name: '設定', selected: true })).toBeTruthy();
    await fireEvent.press(view.getByRole('tab', { name: '曲一覧' }));
    expect(view.getByText('曲一覧ページ')).toBeTruthy();
  });
});
