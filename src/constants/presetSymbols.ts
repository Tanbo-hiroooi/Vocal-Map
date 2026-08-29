import { SymbolCategory, SymbolDefinition } from '@/domain/models';

type Seed = [id: string, symbol: string, name: string, meaning: string, category: SymbolCategory];
// IDは保存済みの歌詞から参照されるため、追加・削除や並べ替えでも変更しない。
const seeds: Seed[] = [
  ['preset-arrow-0','↑','上に抜く','高音を喉で押さず上方向に響かせる','arrow'], ['preset-arrow-1','↓','力を抜く','声や体の力を抜いて落ち着かせる','arrow'],
  ['preset-arrow-2','→','前に飛ばす','声を前方に届ける','arrow'], ['preset-arrow-3','↗','上げていく','音量、音程感、感情を上げていく','arrow'],
  ['preset-arrow-4','↘','落としていく','音量や感情を徐々に落ち着かせる','arrow'], ['preset-arrow-5','⇢','息を流す','息を止めず前に流す','arrow'],
  ['preset-breath-7','／','ブレス','ここで息を吸う','breath'],
  ['preset-breath-8','’','短いブレス','短く素早く息を取る','breath'], ['preset-breath-9','○','深いブレス','しっかり息を吸う','breath'],
  ['preset-dynamics-10','p','ピアノ','弱く歌う','dynamics'], ['preset-dynamics-11','mp','メゾピアノ','やや弱く歌う','dynamics'],
  ['preset-dynamics-12','mf','メゾフォルテ','やや強く歌う','dynamics'], ['preset-dynamics-13','f','フォルテ','強く歌う','dynamics'],
  ['preset-dynamics-14','cresc.','クレッシェンド','だんだん強く','dynamics'], ['preset-dynamics-15','decresc.','デクレッシェンド','だんだん弱く','dynamics'],
  ['preset-vocal-16','息','息を流す','息を止めずに歌う','vocal'], ['preset-vocal-17','前','前に出す','声を前に飛ばす','vocal'],
  ['preset-vocal-18','上','上に抜く','高音を上方向に逃がす','vocal'], ['preset-vocal-19','抜','脱力','喉や体の力を抜く','vocal'],
  ['preset-vocal-20','話','話すように','歌いすぎず自然に言葉を出す','vocal'], ['preset-vocal-21','母','母音注意','母音の形に注意する','vocal'],
  ['preset-vocal-22','喉×','喉で押さない','喉に力を入れすぎない','vocal'], ['preset-vocal-23','Mix','ミックス','ミックスボイスで歌う','vocal'],
  ['preset-vocal-24','Fal','裏声','裏声で歌う','vocal'], ['preset-vocal-25','⌒','なめらかにつなぐ（レガート）','音と言葉を切らず、なめらかにつなぐ','vocal'],
  ['preset-vocal-26','•','短く切る（スタッカート）','音を短く、軽く切る','vocal'], ['preset-vocal-27','—','伸ばす（テヌート）','音の長さを十分に保つ','vocal'],
  ['preset-expression-28','★','大事な言葉','特に大切に歌う','expression'], ['preset-expression-29','!','強調','はっきり強調する','expression'],
  ['preset-expression-30','笑','少し笑顔で','声に明るさを加える','expression'], ['preset-expression-31','泣','切なく','泣きすぎず切なく歌う','expression'],
  ['preset-expression-32','優','やさしく','やわらかく歌う','expression'], ['preset-expression-33','熱','熱量を出す','感情を強める','expression'],
  ['preset-expression-34','抑','抑える','感情や音量を抑える','expression'],
  ['preset-arrow-35','⤴','曲線で上げる（しゃくり）','音程やニュアンスをなめらかに上げる','arrow'],
  ['preset-arrow-36','⤵','曲線で下げる（フォール）','音程やニュアンスをなめらかに下げる','arrow'],
];
const categoryColors: Record<SymbolCategory, string> = {
  arrow:'#4B68D1', breath:'#16836B', dynamics:'#9A4D12', vocal:'#6941C6', expression:'#C23D69', custom:'#59636E',
};

export function createPresetSymbols(date = new Date().toISOString()): SymbolDefinition[] {
  return seeds.map(([id, symbol, name, meaning, category], order) => ({
    id, symbol, name, meaning, category,
    color: categoryColors[category], isPreset: true, isFavorite: false, order, createdAt: date, updatedAt: date,
  }));
}

export const categoryLabels: Record<SymbolCategory, string> = {
  arrow:'矢印・方向', breath:'ブレス', dynamics:'強弱', vocal:'発声', expression:'表現', custom:'カスタム',
};
