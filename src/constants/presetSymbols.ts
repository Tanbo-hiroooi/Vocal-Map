import { SymbolCategory, SymbolDefinition } from '@/domain/models';

type Seed = [string, string, string, SymbolCategory];
const seeds: Seed[] = [
  ['↑','上に抜く','高音を喉で押さず上方向に響かせる','arrow'], ['↓','力を抜く','声や体の力を抜いて落ち着かせる','arrow'],
  ['→','前に飛ばす','声を前方に届ける','arrow'], ['↗','上げていく','音量、音程感、感情を上げていく','arrow'],
  ['↘','落としていく','音量や感情を徐々に落ち着かせる','arrow'], ['⇢','息を流す','息を止めず前に流す','arrow'],
  ['～','なめらかに','音と言葉を滑らかにつなげる','arrow'], ['／','ブレス','ここで息を吸う','breath'],
  ['’','短いブレス','短く素早く息を取る','breath'], ['○','深いブレス','しっかり息を吸う','breath'],
  ['p','ピアノ','弱く歌う','dynamics'], ['mp','メゾピアノ','やや弱く歌う','dynamics'],
  ['mf','メゾフォルテ','やや強く歌う','dynamics'], ['f','フォルテ','強く歌う','dynamics'],
  ['cresc.','クレッシェンド','だんだん強く','dynamics'], ['decresc.','デクレッシェンド','だんだん弱く','dynamics'],
  ['息','息を流す','息を止めずに歌う','vocal'], ['前','前に出す','声を前に飛ばす','vocal'],
  ['上','上に抜く','高音を上方向に逃がす','vocal'], ['抜','脱力','喉や体の力を抜く','vocal'],
  ['話','話すように','歌いすぎず自然に言葉を出す','vocal'], ['母','母音注意','母音の形に注意する','vocal'],
  ['喉×','喉で押さない','喉に力を入れすぎない','vocal'], ['Mix','ミックス','ミックスボイスで歌う','vocal'],
  ['Fal','裏声','裏声で歌う','vocal'], ['⌒','なめらかにつなぐ（レガート）','音と言葉を切らず、なめらかにつなぐ','vocal'],
  ['•','短く切る（スタッカート）','音を短く、軽く切る','vocal'], ['—','伸ばす（テヌート）','音の長さを十分に保つ','vocal'],
  ['★','大事な言葉','特に大切に歌う','expression'], ['!','強調','はっきり強調する','expression'],
  ['笑','少し笑顔で','声に明るさを加える','expression'], ['泣','切なく','泣きすぎず切なく歌う','expression'],
  ['優','やさしく','やわらかく歌う','expression'], ['熱','熱量を出す','感情を強める','expression'],
  ['抑','抑える','感情や音量を抑える','expression'],
  ['⤴','曲線で上げる（しゃくり）','音程やニュアンスをなめらかに上げる','arrow'],
  ['⤵','曲線で下げる（フォール）','音程やニュアンスをなめらかに下げる','arrow'],
];
const categoryColors: Record<SymbolCategory, string> = {
  arrow:'#4B68D1', breath:'#16836B', dynamics:'#9A4D12', vocal:'#6941C6', expression:'#C23D69', custom:'#59636E',
};

export function createPresetSymbols(date = new Date().toISOString()): SymbolDefinition[] {
  return seeds.map(([symbol, name, meaning, category], order) => ({
    id: `preset-${category}-${order}`, symbol, name, meaning, category,
    color: categoryColors[category], isPreset: true, isFavorite: false, order, createdAt: date, updatedAt: date,
  }));
}

export const categoryLabels: Record<SymbolCategory, string> = {
  arrow:'矢印・方向', breath:'ブレス', dynamics:'強弱', vocal:'発声', expression:'表現', custom:'カスタム',
};
