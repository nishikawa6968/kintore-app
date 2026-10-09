import { useState, type ReactNode } from 'react';
import { Header, ScrollArea, SubPage } from '../components/Layout';
import { ChevronDown } from '../components/Icons';
import {
  BackupDemo,
  BalanceDemo,
  Big3FlowDemo,
  BodyTapDemo,
  CalendarDemo,
  FlowDemo,
  GymDemo,
  ManageDemo,
  OverviewDemo,
  RankDemo,
  RecencyDemo,
  RecordKindDemo,
  ReopenDemo,
  RollerDemo,
  RunDemo,
  StepperDemo,
  SwipeTableDemo,
} from './help/HelpDemos';

/**
 * 見出しをタップして開け閉めできる説明のまとまり。
 * 中身（動くお手本を含む）は開いているときだけ作るので、閉じている項目は動かない。
 */
function Section({ title, open: initial = false, children }: { title: string; open?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(initial);
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className="group overflow-hidden rounded-2xl bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 font-bold text-gray-800 [&::-webkit-details-marker]:hidden">
        <span className="flex-1">{title}</span>
        <ChevronDown className="shrink-0 text-gray-400 transition-transform group-open:rotate-180" width={20} height={20} />
      </summary>
      {open && <div className="space-y-3 border-t border-gray-100 px-4 py-3 text-[14px] leading-relaxed text-gray-700">{children}</div>}
    </details>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5 marker:text-brand-300">{children}</ul>;
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-1 pl-5 marker:font-bold marker:text-brand-500">{children}</ol>;
}

export function HelpPage() {
  return (
    <SubPage header={<Header title="使い方" back="/settings" />}>
      <ScrollArea className="space-y-3">
        <Section title="このアプリでできること" open>
          <OverviewDemo />
          <List>
            <li>筋トレの種目・重さ・回数を、日ごとに記録できます。</li>
            <li>どの部位を最近やれていないかが、カレンダーと人の図でひと目で分かります。</li>
            <li>自己ベストは自動で計算され、更新するとお祝いの演出が出ます。</li>
            <li>BIG3（ベンチプレス・スクワット・デッドリフト）のバランスと称号が分かります。</li>
          </List>
        </Section>

        <Section title="記録のつけ方" open>
          <FlowDemo />
          <Steps>
            <li>ホームの「今日の記録をつける」を押す</li>
            <li>「種目を追加」を押す</li>
            <li>部位を選んで、やった種目を押す</li>
            <li>「セットを追加」で重さと回数を入れる</li>
          </Steps>
          <p>入れた内容は自動で保存されます。別の日の記録は、カレンダーの日付から開けます。</p>
        </Section>

        <Section title="セットの入力">
          <StepperDemo />
          <List>
            <li>「−」「＋」で重さ（2.5kgずつ）と回数を変えます。数字を押せば直接入力もできます。</li>
            <li>「セットを追加」を押すと、前のセットと同じ値が入ります。</li>
            <li>「前回」の欄の「コピー」で、前回と同じセットをまとめて入れられます。</li>
            <li>上のタイマーで、セット間の休憩時間を計れます。</li>
          </List>
        </Section>

        <Section title="新記録の演出">
          <RecordKindDemo />
          <List>
            <li>
              今までで<b>一番重い重さ</b>を持つと、上の欄が赤く燃え、セットに「新記録」の印が付きます。
            </li>
            <li>
              <b>同じ重さで回数が増えた</b>とき、<b>推定1RMだけが上がった</b>ときは、上の欄が青く光り「1RM更新」の印が付きます。
            </li>
            <li>推定1RMは、重さと回数から計算した「1回だけ挙げられる重さ」の目安です。</li>
          </List>
        </Section>

        <Section title="ホームの見方">
          <CalendarDemo />
          <RecencyDemo />
          <List>
            <li>カレンダーの青い丸は選んだ部位をやった日、水色はほかの筋トレの日、ピンクは体操の日です。</li>
            <li>ALL のときの人の図は、最近鍛えた部位ほど赤く、1週間以上あいた部位ほど暗い紺色になります。</li>
          </List>
        </Section>

        <Section title="部位の選び方">
          <RollerDemo />
          <BodyTapDemo />
          <List>
            <li>下のロールを指でなぞって回すか、人の図の筋肉を押して部位を選びます。</li>
            <li>ホームでは、人の図のまわりの空いた所を押すと ALL に戻ります。</li>
          </List>
        </Section>

        <Section title="体操の日">
          <GymDemo />
          <List>
            <li>筋トレ以外に体操をした日は、その日の画面で「体操をする」を押します。</li>
            <li>カレンダーがピンクの丸になり、やったことをメモできます。</li>
          </List>
        </Section>

        <Section title="ランニング">
          <RunDemo />
          <List>
            <li>「脚」の「ランニング」は、重さの代わりに距離と時間を入れます。</li>
            <li>最長距離を更新すると赤く燃え、平均ペースだけを更新すると青く光ります。</li>
          </List>
        </Section>

        <Section title="自己ベストの画面">
          <SwipeTableDemo caption="表を左右にスワイプすると、隣の部位へ移る" />
          <List>
            <li>部位ごとに、種目の自己ベストが一覧で見られます。</li>
            <li>1週間以内に更新した種目には、金色のトロフィー（重さの新記録）か青い光（回数・1RMの更新）が付きます。</li>
            <li>種目を押すと、これまでの記録と伸びのグラフが見られます。</li>
          </List>
        </Section>

        <Section title="BIG3と称号">
          <Big3FlowDemo />
          <List>
            <li>ホーム右上の「BIG3」で、ベンチプレス・スクワット・デッドリフトの記録と合計が見られます。</li>
            <li>記録は、回数を問わず今までに持ち上げた一番重い重さです。</li>
          </List>
          <BalanceDemo />
          <List>
            <li>3種目の割合を、一般的な目安の「3 : 4 : 5」と比べて、強め・弱めを教えてくれます。</li>
          </List>
          <RankDemo />
          <List>
            <li>体重を入れると、体重の何倍を挙げたかで、種目ごとに初心者〜エリートのレベルが出ます。</li>
            <li>今の称号は BIG3 合計で決まります。エンブレムを押すと、称号ごとに必要な重さのティア表が見られます。</li>
            <li>
              <b>レベルの目安について：</b>
              成人男性の一般的な基準をもとにした、おおまかな目安です。基準は「1回だけ挙げられる重さ」なので、回数を多くやった重さが記録になっていると、実力より低めに出ます。
            </li>
          </List>
        </Section>

        <Section title="種目の管理（設定）">
          <ManageDemo />
          <List>
            <li>設定の「種目の管理」で、種目の追加・名前の変更・並び替えができます。</li>
            <li>目のアイコンで、使わない種目を隠せます（記録は消えません）。</li>
            <li>鍵マークの種目（ベンチプレス・スクワット・デッドリフト・ランニング）はアプリ固定で、名前は変えられません。隠すことはできます。</li>
          </List>
        </Section>

        <Section title="データのバックアップ">
          <BackupDemo />
          <List>
            <li>記録はこの端末の中だけに保存されます。</li>
            <li>機種変更に備えて、ときどき設定の「データを書き出す」で保存しておきましょう。新しい端末では「データを読み込む」で戻せます。</li>
            <li>いつもホーム画面のアイコンから開いてください（Safari で直接開くと、記録が別になります）。</li>
          </List>
        </Section>

        <Section title="アプリが新しくならないとき">
          <ReopenDemo />
          <List>
            <li>アプリを完全に閉じてから開き直してください（変わらなければもう一度）。</li>
          </List>
        </Section>
      </ScrollArea>
    </SubPage>
  );
}
