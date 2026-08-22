import { colors } from '@/constants/theme';
import { Tabs } from 'expo-router';
import React from 'react';
import { ColorValue, Text } from 'react-native';
const Icon=({text,color}:{text:string;color:ColorValue})=><Text style={{fontSize:20,color}}>{text}</Text>;
export default function TabLayout(){return <Tabs screenOptions={{tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.muted,headerStyle:{backgroundColor:colors.surface},headerTitleStyle:{fontWeight:'800'},tabBarStyle:{minHeight:62,paddingBottom:6}}}>
  <Tabs.Screen name="index" options={{title:'曲',tabBarAccessibilityLabel:'曲一覧',tabBarIcon:({color})=><Icon text="♫" color={color}/>}}/>
  <Tabs.Screen name="symbols" options={{title:'記号辞書',tabBarAccessibilityLabel:'記号辞書',tabBarIcon:({color})=><Icon text="↑" color={color}/>}}/>
  <Tabs.Screen name="settings" options={{title:'設定',tabBarAccessibilityLabel:'設定',tabBarIcon:({color})=><Icon text="⚙" color={color}/>}}/>
</Tabs>}
