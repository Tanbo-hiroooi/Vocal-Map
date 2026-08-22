import { Button } from '@/components/common/Button';
import { FormField } from '@/components/common/FormField';
import { colors } from '@/constants/theme';
import { Song } from '@/domain/models';
import { splitLyrics, updateSongLyrics } from '@/domain/services/lyrics';
import { createId, nowIso } from '@/utils/id';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function SongForm({song,onSave}:{song?:Song;onSave(song:Song):Promise<void>}) {
  const [title,setTitle]=useState(song?.title??''); const [artist,setArtist]=useState(song?.artist??''); const [memo,setMemo]=useState(song?.memo??'');
  const [lyrics,setLyrics]=useState(song?.lyrics.map((line)=>line.text).join('\n')??''); const [errors,setErrors]=useState<{title?:string;lyrics?:string}>({}); const [saving,setSaving]=useState(false); const [message,setMessage]=useState('');
  const submit=async()=>{const nextErrors={title:!title.trim()?'曲タイトルを入力してください。':undefined,lyrics:!lyrics.trim()?'歌詞を入力してください。':undefined};setErrors(nextErrors);if(nextErrors.title||nextErrors.lyrics)return;
    setSaving(true);setMessage('');const date=nowIso();const value:Song={id:song?.id??createId(),title:title.trim(),artist:artist.trim()||undefined,memo:memo.trim()||undefined,lyrics:song?updateSongLyrics(song,lyrics):splitLyrics(lyrics),createdAt:song?.createdAt??date,updatedAt:date};
    try{await onSave(value)}catch{setMessage('保存できませんでした。もう一度お試しください。')}finally{setSaving(false)}};
  return <View style={styles.form}><View><Text style={styles.kicker}>VOCAL MAP</Text><Text style={styles.title}>{song?'曲と歌詞を編集':'歌唱設計図を作る'}</Text><Text style={styles.lead}>歌詞は端末内だけに保存され、外部へ送信されません。</Text></View>
    <FormField label="曲タイトル *" value={title} onChangeText={setTitle} error={errors.title} placeholder="例：練習曲" returnKeyType="next"/>
    <FormField label="アーティスト名" value={artist} onChangeText={setArtist} placeholder="任意"/>
    <FormField label="曲についてのメモ" value={memo} onChangeText={setMemo} placeholder="キー、練習目標など" multiline/>
    <FormField label="歌詞 *" value={lyrics} onChangeText={setLyrics} error={errors.lyrics} hint="改行ごとに1行として保存します。空行も保持されます。" placeholder="歌詞を入力または貼り付け" multiline style={styles.lyrics}/>
    {!!message&&<Text accessibilityRole="alert" style={styles.error}>{message}</Text>}<Button label="保存する" onPress={()=>void submit()} loading={saving}/>
  </View>;
}
const styles=StyleSheet.create({form:{gap:18},kicker:{fontSize:12,letterSpacing:2,color:colors.primary,fontWeight:'800'},title:{fontSize:28,fontWeight:'900',color:colors.text,marginTop:5},lead:{fontSize:14,color:colors.muted,lineHeight:21,marginTop:6},lyrics:{minHeight:240},error:{color:colors.danger}});
