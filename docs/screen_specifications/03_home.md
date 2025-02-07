# ホーム画面仕様書

## 画面概要
ユーザーがログイン後に表示される主要な画面です。チャットルームの作成、参加、および他の主要機能へのアクセスを提供します。

## レイアウト
```
+----------------------------------+
|           どうぶつチャット        |
|                ユーザー名        |
+----------------------------------+
|                                  |
|  [最後に参加したルーム]          |
|  +----------------------------+  |
|  | ルーム名                   |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | 新しいルームを作成         |  |
|  |                           |  |
|  | [入力欄]                  |  |
|  | [作成]                    |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | ルームに参加              |  |
|  |                           |  |
|  | [入力欄]                  |  |
|  | [参加]                    |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  |        ログアウト         |  |
|  +----------------------------+  |
+----------------------------------+
```

## 機能要素
1. ヘッダー
   - アプリ名（どうぶつチャット）
   - ユーザー名表示（アイコン付き）

2. 最後に参加したルーム
   - 最後に参加したルームの名前を表示
   - クリックで該当ルームに移動
   - 参加履歴がない場合は非表示

3. ルーム作成フォーム
   - ルーム名入力フィールド
     - プレースホルダー: "例: キリンの部屋"
   - 作成ボタン
     - アイコン: PlusCircle
     - クリックで新規ルーム作成

4. ルーム参加フォーム
   - ルームID入力フィールド
     - プレースホルダー: "ルームIDを入力"
   - 参加ボタン
     - アイコン: DoorOpen
     - クリックで指定ルームに参加

5. ログアウトボタン
   - アイコン: LogOut
   - クリックでログアウト処理を実行
   - ログイン画面に遷移

## デザイン要素
- 全体的に明るく清潔感のあるデザイン
- Tailwind CSSを使用してレスポンシブ対応
- カラースキーム
  - メインカラー: #4CAF50（緑）
  - ホバー時: #45a049（濃い緑）
  - 背景色: #FFF8E1（薄い黄色）
- レイアウト
  - 固定幅のシングルカラム表示
  - フォーム要素を縦に配置
- カードデザイン
  - 白背景
  - 影付き
  - 角丸

## その他の注意点
- 入力バリデーション
  - ルーム名: 空文字チェック
  - ルームID: 空文字チェック、存在確認
- エラーハンドリング
  - ルーム作成失敗時のエラー表示
  - 存在しないルームIDでの参加試行時のエラー表示
- 将来的な拡張
  - ルーム検索機能
  - 参加履歴の一覧表示
  - ルームのカテゴリ分け
