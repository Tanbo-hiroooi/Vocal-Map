import { Button } from '@/components/common/Button';import { chooseAction,confirmAction } from '@/components/common/confirmationDialog';import { PageHeading } from '@/components/common/PageHeading';import { Screen } from '@/components/common/Screen';import { colors,shadow } from '@/constants/theme';import { parseImportJson } from '@/domain/validators/importData';import { useAppData } from '@/features/app/AppProvider';import { exportJsonFile,pickJsonFile } from '@/features/settings/dataTransfer';import { vocalMapRepository } from '@/repositories/LocalVocalMapRepository';import Constants from 'expo-constants';import React,{useState} from 'react';import { StyleSheet,Text,useWindowDimensions,View } from 'react-native';
export default function SettingsScreen(){
  const {settings,saveSettings,refresh}=useAppData();
  const {width}=useWindowDimensions();
  const [message,setMessage]=useState('');
  const change=(key:'defaultFontSize'|'practiceFontSize',delta:number)=>void saveSettings({...settings,[key]:Math.max(14,Math.min(44,settings[key]+delta))});
  const exportData=async()=>{try{const data=await vocalMapRepository.exportData();await exportJsonFile(JSON.stringify(data,null,2));setMessage('バックアップを書き出しました。')}catch(e){setMessage(e instanceof Error?e.message:'エクスポートに失敗しました。')}};
  const importData=async()=>{try{
    const json=await pickJsonFile();if(!json)return;
    const result=parseImportJson(json);if(!result.valid){setMessage(result.message);return}
    const method=await chooseAction('読み込み方法を選択','追加は同じIDのデータだけ更新します。置き換えは現在の全データを消します。',[{label:'追加',value:'merge'},{label:'置き換え',value:'replace',destructive:true}] as const);
    if(!method)return;
    if(method==='replace'&&!await confirmAction('本当に置き換えますか？','現在のデータは元に戻せません。','置き換える',true))return;
    await vocalMapRepository.importData(result.data,method);await refresh();setMessage(method==='merge'?'データを追加しました。':'データを置き換えました。');
  }catch(e){setMessage(e instanceof Error?e.message:'インポートに失敗しました。')}};
  const reset=async()=>{if(!await confirmAction('プリセットを初期化しますか？','編集したプリセットが元に戻ります。','初期化'))return;await vocalMapRepository.resetPresetSymbols();await refresh();setMessage('プリセットを初期化しました。')};
  const clear=async()=>{if(!await confirmAction('全データを削除しますか？','曲、記号、設定がすべて削除されます。この操作は元に戻せません。','すべて削除',true))return;await vocalMapRepository.clearAll();await refresh();setMessage('全データを削除しました。')};
  return <Screen>
    <PageHeading eyebrow="MAKE IT YOURS" title="設定" description="見やすさも、大切なデータも、ここから。" />
    {!!message&&<Text accessibilityRole="alert" style={styles.message}>{message}</Text>}
    <View style={styles.grid}>
      <View style={[styles.card,width>=760&&styles.wideCard]}>
        <SectionLabel icon="Aa" title="文字サイズ" color={colors.lavender}/>
        <SettingStepper label="編集画面" value={settings.defaultFontSize} onMinus={()=>change('defaultFontSize',-1)} onPlus={()=>change('defaultFontSize',1)}/>
        <SettingStepper label="練習モード" value={settings.practiceFontSize} onMinus={()=>change('practiceFontSize',-2)} onPlus={()=>change('practiceFontSize',2)}/>
      </View>
      <View style={[styles.card,width>=760&&styles.wideCard]}>
        <SectionLabel icon="↥" title="バックアップ" color={colors.mint}/>
        <Text style={styles.help}>曲・記号・設定をまとめてJSONファイルに保存できます。</Text>
        <Button label="データをエクスポート" onPress={()=>void exportData()}/><Button label="データをインポート" variant="secondary" onPress={()=>void importData()}/>
      </View>
      <View style={[styles.card,width>=760&&styles.wideCard]}>
        <SectionLabel icon="↺" title="初期化" color={colors.primarySoft}/>
        <Text style={styles.help}>データを整理するときに。削除の前にバックアップを。</Text>
        <Button label="プリセット記号を初期化" variant="secondary" onPress={()=>void reset()}/><Button label="全データを削除" variant="danger" onPress={()=>void clear()}/>
      </View>
      <View style={[styles.card,width>=760&&styles.wideCard]}>
        <SectionLabel icon="✓" title="プライバシー" color={colors.sunshine}/>
        <Text style={styles.help}>入力した歌詞と歌唱メモは端末内だけに保存されます。外部API、広告、分析、追跡、マイクは使用しません。歌詞は権利を守ってご自身で入力してください。</Text>
        <Text style={styles.version}>Vocal Map バージョン {Constants.expoConfig?.version??'1.0.0'}</Text>
      </View>
    </View>
  </Screen>
}
function SectionLabel({icon,title,color}:{icon:string;title:string;color:string}){return <View style={styles.sectionRow}><Text aria-hidden style={[styles.sectionIcon,{backgroundColor:color}]}>{icon}</Text><Text style={styles.section}>{title}</Text></View>}
function SettingStepper({label,value,onMinus,onPlus}:{label:string;value:number;onMinus():void;onPlus():void}){return <View style={styles.stepper}><Text style={styles.settingLabel}>{label}</Text><Button label="−" variant="ghost" onPress={onMinus} accessibilityLabel={`${label}の文字を小さくする`}/><Text style={styles.value}>{value}px</Text><Button label="＋" variant="ghost" onPress={onPlus} accessibilityLabel={`${label}の文字を大きくする`}/></View>}
const styles=StyleSheet.create({message:{color:colors.primaryDark,backgroundColor:colors.primarySoft,padding:12,borderRadius:12},grid:{flexDirection:'row',flexWrap:'wrap',gap:12},card:{width:'100%',minWidth:0,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:20,padding:16,gap:12,...shadow},wideCard:{flexBasis:'48%',flexGrow:1,maxWidth:'50%'},sectionRow:{flexDirection:'row',alignItems:'center',gap:10},sectionIcon:{width:34,height:34,lineHeight:34,textAlign:'center',borderRadius:10,overflow:'hidden',fontSize:20,fontWeight:'800',color:colors.text},section:{fontSize:18,fontWeight:'900',color:colors.text},help:{fontSize:13,color:colors.muted,lineHeight:21},stepper:{flexDirection:'row',alignItems:'center',gap:6,minHeight:46},settingLabel:{flex:1,color:colors.text,fontSize:13,fontWeight:'700'},value:{minWidth:44,textAlign:'center',fontWeight:'800',color:colors.primaryDark},version:{marginTop:4,fontSize:11,color:colors.muted}});
