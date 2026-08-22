import { colors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
export function FormField({ label, error, hint, ...props }: TextInputProps & { label: string; error?: string; hint?: string }) {
  return <View style={styles.wrap}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor="#9A949F" {...props} style={[styles.input, props.multiline && styles.multiline, props.style]} />
    {!!hint && !error && <Text style={styles.hint}>{hint}</Text>}{!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}</View>;
}
const styles=StyleSheet.create({wrap:{gap:7},label:{fontSize:15,fontWeight:'700',color:colors.text},input:{minHeight:48,borderWidth:1,borderColor:colors.border,borderRadius:12,paddingHorizontal:14,paddingVertical:11,backgroundColor:colors.surface,color:colors.text,fontSize:16},multiline:{minHeight:112,textAlignVertical:'top'},hint:{fontSize:12,color:colors.muted},error:{fontSize:13,color:colors.danger}});
