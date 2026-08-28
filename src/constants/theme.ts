import { Platform } from 'react-native';

export const colors = {
  primary: '#CD4434', primaryDark: '#A82F23', primarySoft: '#FFF0E9', primaryBorder: '#F0BAAC',
  background: '#FFF9F0', surface: '#FFFFFF', text: '#243744', muted: '#64717C',
  border: '#E6DFD3', danger: '#B52940', dangerSoft: '#FFF0F2', warning: '#875A06', success: '#176953',
  mint: '#DCF3E9', sunshine: '#FFE7A0', lavender: '#E9E3FF', blue: '#DDE8FF',
};
export const layout = { maxWidth: 960, radius: 20, tapSize: 46, compactWidth: 640 };
export const shadow = Platform.select({
  ios: { shadowColor: '#243744', shadowOpacity: 0.06, shadowRadius: 0, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 2 },
  default: { boxShadow: '0 4px 0 rgba(36,55,68,0.06)' },
});
