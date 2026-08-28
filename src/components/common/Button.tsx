import { colors, layout } from '@/constants/theme';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type Props = { label: string; onPress(): void; variant?: 'primary'|'secondary'|'ghost'|'danger'; disabled?: boolean; loading?: boolean; style?: ViewStyle; accessibilityLabel?: string };
export function Button({ label, onPress, variant='primary', disabled, loading, style, accessibilityLabel }: Props) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} disabled={disabled || loading} onPress={onPress}
    style={({pressed}) => [styles.base, styles[variant], pressed && styles.pressed, (disabled || loading) && styles.disabled, style]}>
    {loading ? <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary}/> : <Text style={[styles.text, variant === 'primary' && styles.primaryText, variant === 'danger' && styles.dangerText]}>{label}</Text>}
  </Pressable>;
}
const styles = StyleSheet.create({
  base:{minHeight:layout.tapSize,paddingHorizontal:16,paddingVertical:10,borderRadius:14,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'transparent'},
  primary:{backgroundColor:colors.primary,borderColor:colors.primaryDark,borderBottomWidth:3}, secondary:{backgroundColor:colors.primarySoft,borderColor:colors.primaryBorder}, ghost:{backgroundColor:'transparent'}, danger:{backgroundColor:colors.dangerSoft,borderColor:'#EAC0C8'},
  text:{fontSize:15,fontWeight:'800',color:colors.text,textAlign:'center'}, primaryText:{color:'#fff'}, dangerText:{color:colors.danger}, pressed:{opacity:.78,transform:[{translateY:1}]}, disabled:{opacity:.45},
});
