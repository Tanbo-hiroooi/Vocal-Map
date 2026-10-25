import { ViewStyle } from 'react-native';

// Safariでハンドルのドラッグがページスクロールへ切り替わることを防ぐ。
export const selectionHandleStyle: ViewStyle & { touchAction: 'none' } = { touchAction: 'none' };
