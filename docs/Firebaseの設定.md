# 成績機能（点数の提出・順位表・分布）を動かすための Firebase の設定

成績機能は、Google の無料サービス **Firebase**（無料の Spark プラン）に点数を保存します。
最初に一度だけ、次の設定をしてください（10分ほど）。

## 1. プロジェクトを作る
1. https://console.firebase.google.com/ を開き、Google アカウントでログインする（個人のアカウントでよい）。
2. 「プロジェクトを追加」→ 名前は例えば `shonan-test-portal` → Google アナリティクスはオフ → 作成。

## 2. ログイン（メールのリンク）を有効にする
1. 左のメニュー「構築 → Authentication」→「始める」。
2. 「Sign-in method」で「メール / パスワード」を選び、**「メールリンク（パスワードなしでログイン）」をオン**にして保存。
3. 「Settings」→「承認済みドメイン」に **`seg1gpt0jpn.github.io`** を追加。

## 3. データベースを作る
1. 「構築 → Firestore Database」→「データベースを作成」→ 場所は `asia-northeast1（東京）` → **本番環境モード**で開始。
2. 「ルール」タブを開き、このリポジトリの `firestore.rules` の中身をすべて貼り付ける。
3. 貼り付けた中の `ADMIN_EMAIL@gl.pen-kanagawa.ed.jp` を、**管理者（あなた）の学校のメールアドレス**に書き換えて「公開」。

## 4. ウェブアプリを登録して設定値をもらう
1. 「プロジェクトの概要」の横の歯車 →「プロジェクトの設定」→「マイアプリ」で「</>（ウェブ）」を押す。
2. ニックネームを入れて登録（Firebase Hosting はチェックしない）。
3. 表示される `firebaseConfig` の `apiKey`・`authDomain`・`projectId`・`appId` を、`data/firebase.json` に書く。`adminEmails` には管理者の学校メールアドレスを入れる。

```json
{"apiKey":"AIza...","authDomain":"xxxx.firebaseapp.com","projectId":"xxxx","appId":"1:...:web:...","adminEmails":["あなたの学校メール@gl.pen-kanagawa.ed.jp"]}
```

> `apiKey` などは公開しても問題ない値です（誰が読み書きできるかは `firestore.rules` で制限しています）。
> Claude に設定値を送ってくれれば、`data/firebase.json` に入れて反映します。

## しくみのまとめ
| | 誰ができるか |
|---|---|
| 点数の提出・修正・削除 | 学校のメール（@gl.pen-kanagawa.ed.jp）でログインした本人だけ |
| 順位表を見る | 学校のメールでログインした人だけ（掲載に同意した人のニックネームと点数） |
| 出席番号 | 本人と管理者だけが見られる。順位表にも分布にも出ない |
| 点数の分布（人数・平均・標準偏差・10点刻みの人数） | 誰でも見られる。管理者が順位表のページで「集計を更新する」を押したときに作られる。提出者が10人未満の科目は出さない |
