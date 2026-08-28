import { colors, layout } from '@/constants/theme';
import React, { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export function Screen({children, scroll=true, contentStyle}: PropsWithChildren<{scroll?:boolean;contentStyle?:ViewStyle}>) {
  const { width } = useWindowDimensions();
  const body=<View style={[styles.content,width < layout.compactWidth && styles.compact,contentStyle]}>{children}</View>;
  return <SafeAreaView edges={['left','right','bottom']} style={styles.safe}><KeyboardAvoidingView style={styles.safe} behavior={Platform.OS==='ios'?'padding':undefined}>{scroll?<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>{body}</ScrollView>:body}</KeyboardAvoidingView></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,minHeight:0,backgroundColor:colors.background},scroll:{flexGrow:1},content:{width:'100%',maxWidth:layout.maxWidth,alignSelf:'center',padding:20,gap:16},compact:{padding:12,gap:12}});
