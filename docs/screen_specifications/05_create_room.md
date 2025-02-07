# チャットルーム作成画面仕様書

## 画面概要
ユーザーが新しいチャットルームを作成するための画面です。ルーム名の入力と作成後のURLの生成・コピー機能を提供します。

## レイアウト
```
+----------------------------------+
|  ヘッダー                        |
|  ロゴ           戻る             |
+----------------------------------+
|                                  |
|  チャットルーム作成              |
|                                  |
|  +----------------------------+  |
|  | ルーム名                   |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  |        作成                |  |
|  +----------------------------+  |
|                                  |
|  作成されたURLをコピー          |
|                                  |
+----------------------------------+
```

## 機能要素
1. ヘッダー
   - ロゴ: アプリのロゴを表示
   - 戻るボタン: クリックで前の画面に戻る

2. ルーム名入力フィールド
   - 入力形式: テキスト
   - バリデーション: 2文字以上20文字以下

3. 作成ボタン
   - クリックでルームを作成し、URLを生成
   - 作成されたURLをコピー可能な領域を表示

## エラーハンドリング
- ルーム名が短すぎる/長すぎる: "ルーム名は2文字以上20文字以下で入力してください"
- ルームの作成に失敗した場合: "ルームの作成に失敗しました。再度お試しください"

## デザイン要素
- 全体的に明るく清潔感のあるデザイン
- Tailwind CSSを使用してレスポンシブ対応
- 入力フィールドは十分な大きさで操作しやすく
- 作成ボタンは目立つ色使いで、タップ/クリックしやすいサイズに

## その他の注意点
- ルーム名の入力に制限を設けるか検討（例: 特定の文字列を含める/含めない）
- 作成されたURLをコピーできる領域の実装方法を検討（例: コピーボタン、自動コピー）
- 将来的に、ルームの設定（パスワード保護、参加制限など）を追加する可能性を検討