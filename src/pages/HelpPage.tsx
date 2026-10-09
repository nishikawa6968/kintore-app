import { useState, type ReactNode } from 'react';
import { Header, ScrollArea, SubPage } from '../components/Layout';
import { ChevronDown } from '../components/Icons';
import { BodyTapDemo, CalendarDemo, FireDemo, FlowDemo, RecencyDemo, RollerDemo, StepperDemo, SwipeTableDemo } from './help/HelpDemos';

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
          <List>
            <li>筋トレの種目・重さ・回数を、日ごとに記録できます。</li>
            <li>種目ごとの自己ベストを自動で計算し、更新するとお知らせします。</li>
            <li>カレンダーと人の図で、どの部位を最近やれていないかがひと目で分かります。</li>
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
          <p>体操をした日は、その日の画面で「体操をする」を押します。カレンダーがピンクの丸になり、やったことをメモできます。</p>
        </Section>

        <Section title="ホームの見方">
          <CalendarDemo />
          <RecencyDemo />
          <List>
            <li>カレンダーの青い丸は選んだ部位をやった日、水色はほかの筋トレの日、ピンクは体操の日です。</li>
            <li>下のロールで部位を選ぶと、カレンダーと人の図がその部位に切り替わります。</li>
            <li>ALL のときの人の図は、最近鍛えた部位ほど赤、やれていない部位ほど暗い紺色になります。</li>
          </List>
        </Section>

        <Section title="部位の選び方（ロール・人の図）">
          <RollerDemo />
          <BodyTapDemo />
          <List>
            <li>ロールを指でなぞって回すか、人の図の筋肉を押して部位を選びます。</li>
            <li>ホームでは、人の図の空いた所を押すと ALL になります。</li>
          </List>
        </Section>

        <Section title="セットの入力と自己ベスト">
          <StepperDemo />
          <FireDemo />
          <List>
            <li>「−」「＋」で重さと回数を変えます。数字を押せば直接入力もできます。</li>
            <li>「セットを追加」を押すと、前のセットの値が自動で入ります。</li>
            <li>「前回」の欄の「コピー」で、前回と同じセットをまとめて入れられます。</li>
            <li>今までで一番重い重さを持つと、上の欄が赤く燃え、そのセットに「新記録」の印が付きます。</li>
            <li>同じ重さで回数が増えたときや、推定1RMだけを更新したときは、上の欄が青く光り、「1RM更新」の印が付きます。</li>
          </List>
        </Section>

        <Section title="ランニング">
          <List>
            <li>「脚」の「ランニング」は、距離と時間を入れます。</li>
            <li>1kmあたりの平均ペースが自動で出ます。自己ベストは最長距離とベスト平均ペースです。</li>
          </List>
        </Section>

        <Section title="自己ベストの画面">
          <SwipeTableDemo caption="表を左右にスワイプすると、隣の部位へ移る" />
          <List>
            <li>部位ごとに、種目の自己ベストが一覧で見られます。</li>
            <li>種目を押すと、これまでの記録とグラフが見られます。</li>
          </List>
        </Section>

        <Section title="BIG3">
          <List>
            <li>ホーム右上の「BIG3」で、ベンチプレス・スクワット・デッドリフトの一番重い記録と合計が見られます。</li>
            <li>3種目の割合を目安の 3 : 4 : 5 と比べ、強め・弱めが分かります。</li>
            <li>体重を入れると、初心者〜エリートのどのレベルかが分かります。</li>
          </List>
        </Section>

        <Section title="種目の追加・編集（設定）">
          <List>
            <li>設定の「種目の管理」で、種目の追加・名前の変更・並び替えができます。</li>
            <li>目のアイコンで、使わない種目を隠せます（記録は消えません）。</li>
            <li>種目選択の画面の「種目を追加」からも追加できます。</li>
          </List>
        </Section>

        <Section title="データのバックアップ">
          <List>
            <li>記録はこの端末の中だけに保存されます。</li>
            <li>機種変更に備えて、ときどき設定の「データを書き出す」で保存しておきましょう。新しい端末では「データを読み込む」で戻せます。</li>
            <li>いつもホーム画面のアイコンから開いてください（Safari で直接開くと、記録が別になります）。</li>
          </List>
        </Section>

        <Section title="アプリが新しくならないとき">
          <List>
            <li>アプリを完全に閉じてから開き直してください（変わらなければもう一度）。</li>
          </List>
        </Section>
      </ScrollArea>
    </SubPage>
  );
}
