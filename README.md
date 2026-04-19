# Gomil

住所や郵便番号から、中央区のごみ収集曜日を確認する静的サイトです。

HTML/CSS/JavaScriptだけで動くため、GitHub Pagesなどの静的ホスティングにそのまま公開できます。ユーザーが入力した住所は外部サーバーへ送信せず、ブラウザ内で検索します。

## ファイル構成

```text
index.html                 画面本体
styles.css                 デザイン
app.js                     検索・表示ロジック
data.js                    CSVをブラウザで直接読める形にしたデータ
ゴミ収集日2026 - 完成.csv   元データ
```

## ローカルで確認する

```bash
cd /Users/yuki/Documents/codex/GOMI
python3 -m http.server 5174
```

ブラウザで開きます。

```text
http://localhost:5174/
```

## GitHub Pagesで公開する

1. GitHubで新しいリポジトリを作成します。
   例: `gimil`

2. このフォルダをGit管理にしてpushします。

```bash
cd /Users/yuki/Documents/codex/GOMI
git init
git add index.html styles.css app.js data.js "ゴミ収集日2026 - 完成.csv" README.md
git commit -m "Initial Gomil site"
git branch -M main
git remote add origin https://github.com/yukihoz/gimil.git
git push -u origin main
```

3. GitHubのリポジトリ画面でPagesを有効にします。

```text
Settings -> Pages -> Build and deployment
Source: Deploy from a branch
Branch: main
Folder: / (root)
Save
```

4. 数分後、以下のURLで公開されます。

```text
https://yukihoz.github.io/gimil/
```

## データを更新する

元データはCSVです。列名は以下の形にしてください。

```csv
No.,名称,燃やすごみ,燃やさないごみ,プラマーク,資源,粗大ごみ
1,銀座１丁目,月・火・水・木・金・土,月,木,木,木
```

CSVを差し替えたら、`data.js` を作り直します。

```bash
cd /Users/yuki/Documents/codex/GOMI
node -e "const fs=require('fs'); const csv=fs.readFileSync('ゴミ収集日2026 - 完成.csv','utf8'); fs.writeFileSync('data.js','window.GOMI_CSV_DATA = '+JSON.stringify(csv)+';\\n');"
```

その後、ブラウザをリロードして確認します。

## 郵便番号を更新する

郵便番号は `app.js` の `postalCodes` に定義しています。

```js
const postalCodes = {
  銀座: "1040061",
  新富: "1040041",
};
```

別の地域で使う場合は、CSVの `名称` と対応する町域名をここに追加・変更してください。

## 別の自治体向けに流用する

主に変更する場所は以下です。

```text
index.html   サイト名、説明文、画像
styles.css   色、余白、カードデザイン
app.js       郵便番号、検索対象、カテゴリ名
CSV          町名と収集曜日
```

ごみ種別を変える場合は、`app.js` の `categories` を編集します。

```js
const categories = [
  { key: "燃やすごみ", label: "燃やすごみ", icon: icons.burnable, kind: "burnable" },
];
```

`key` はCSVの列名と一致させてください。

## 公開時の注意

- `data.js` とCSVは公開されます。
- 今の実装では入力内容をサーバーへ送信しません。
- GitHub Pagesは静的ファイルの公開に向いています。
- 独自ドメインを使う場合は、GitHub Pagesの `Custom domain` から設定できます。

## よくある作業

デザインだけ直したい場合:

```text
styles.css を編集
```

文言を直したい場合:

```text
index.html を編集
```

データを直したい場合:

```text
CSVを編集 -> data.jsを再生成
```

公開版に反映したい場合:

```bash
git add .
git commit -m "Update Gomil"
git push
```
