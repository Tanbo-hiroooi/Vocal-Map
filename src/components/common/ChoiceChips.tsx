import { colors } from '@/constants/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
export function ChoiceChips<T extends string>({value,options,onChange}: {value:T;options:{value:T;label:string}[];onChange(value:any):void}) {
  return <View style={styles.row}>{options.map((item)=><Pressable accessibilityRole="radio" accessibilityState={{checked:value===item.value}} key={item.value} onPress={()=>onChange(item.value)} style={[styles.chip,value===item.value&&styles.active]}><Text style={[styles.text,value===item.value&&styles.activeText]}>{item.label}</Text></Pressable>)}</View>;
}
const styles=StyleSheet.create({row:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{minHeight:44,justifyContent:'center',paddingHorizontal:13,borderWidth:1,borderColor:colors.border,borderRadius:14,backgroundColor:colors.surface},active:{backgroundColor:colors.primarySoft,borderColor:colors.primary},text:{color:colors.text,fontSize:13,fontWeight:'600'},activeText:{color:colors.primaryDark,fontWeight:'800'}});
