/**
 * ファイルを共有する。iPhone では共有の画面（ファイルに保存・iCloud Drive・メッセージなど）を開き、
 * 共有の画面が使えないブラウザでは、そのままダウンロードする。
 */
export async function shareOrDownload(fileName: string, text: string, type = 'text/plain') {
  const file = new File([text], fileName, { type: `${type};charset=utf-8` });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      return;
    } catch (e) {
      // 共有の画面を閉じただけなら何もしない
      if (e instanceof DOMException && e.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
