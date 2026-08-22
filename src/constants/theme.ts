import { Platform } from 'react-native';

export const colors = {
  primary: '#6941C6', primaryDark: '#8B6DDB', primarySoft: '#F2ECFF',
  background: '#F8F7FB', surface: '#FFFFFF', text: '#25232A', muted: '#706B78',
  border: '#E5E1EA', danger: '#C83B4C', warning: '#9A6700', success: '#247A52',
};
export const layout = { maxWidth: 880, radius: 16, tapSize: 44 };
export const shadow = Platform.select({
  ios: { shadowColor: '#241A38', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 2 },
  default: { boxShadow: '0 4px 18px rgba(36,26,56,0.08)' },
});
