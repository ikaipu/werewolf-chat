# Cloud Functions 仕様

## 概要
チャットルームの自動管理のために実装されたCloud Functions。
非アクティブなルームを自動的に削除し、システムリソースを効率的に管理します。

## 実装された機能

### 1. ルームアクティビティの追跡

#### 1.1 ルーム作成時のアクティビティ設定
- 関数名: `setRoomLastActivityOnCreate`
- トリガー: ルームドキュメントの作成時
- パス: `rooms/{roomId}`
- 処理内容:
  - 新しいルームが作成されたときに、`lastActivity`フィールドを現在時刻で設定
  - エラー発生時はログに記録

#### 1.2 メッセージ作成時のアクティビティ更新
- 関数名: `updateRoomLastActivityOnMessage`
- トリガー: メッセージドキュメントの作成時
- パス: `rooms/{roomId}/messages/{messageId}`
- 処理内容:
  - 新しいメッセージが作成されたときに、親ルームの`lastActivity`フィールドを現在時刻で更新
  - エラー発生時はログに記録

#### 1.3 参加者入室時のアクティビティ更新
- 関数名: `updateRoomLastActivityOnJoin`
- トリガー: 参加者ドキュメントの作成時
- パス: `rooms/{roomId}/participants/{userId}`
- 処理内容:
  - 新しい参加者が入室したときに、ルームの`lastActivity`フィールドを現在時刻で更新
  - エラー発生時はログに記録

### 2. 非アクティブルームの自動削除

#### 2.1 定期クリーンアップ処理
- 関数名: `cleanupInactiveRooms`
- スケジュール: 毎時0分に実行
- タイムアウト: 9分
- 処理内容:
  - 60分以上アクティビティのないルームを検出
  - 以下の順序で完全削除を実行:
    1. messagesサブコレクションの削除
    2. participantsサブコレクションの削除
    3. ルームドキュメント自体の削除
  - 削除結果をログに記録

## データ構造

### ルームドキュメント
```typescript
interface Room {
  name: string;
  createdAt: Timestamp;
  lastActivity: Timestamp;  // アクティビティ追跡用
  // その他のフィールド
}
```

## エラーハンドリング
- すべての操作は try-catch でラップ
- エラーは Firebase Cloud Functions のログに記録
- エラー発生時もシステムの動作は継続

## デプロイ情報
- リージョン: asia-northeast1
- ランタイム: Node.js 22
- 環境変数:
  - REGION: "asia-northeast1"

## 注意事項
1. ルームの削除は取り消しできない操作のため、`lastActivity`の更新が確実に行われることが重要
2. サブコレクションの削除は再帰的に行われないため、明示的に削除処理を実装
3. 定期実行の間隔とタイムアウト時間は、処理の完了を考慮して設定
