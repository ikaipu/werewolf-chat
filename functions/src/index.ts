import * as admin from "firebase-admin";
import {onDocumentCreated, FirestoreEvent, QueryDocumentSnapshot} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineString} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

// リージョンを設定
const region = defineString("REGION", {default: "asia-northeast1"});

// Firebase Admin初期化
admin.initializeApp();

// ルームの最終アクティビティ時刻を更新する共通関数
const updateLastActivity = async (roomId: string) => {
  const roomRef = admin.firestore().collection("rooms").doc(roomId);
  try {
    await roomRef.update({
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info(`Updated lastActivity for room ${roomId}`);
  } catch (error) {
    logger.error("Error updating room lastActivity:", error);
  }
};

// ルームが作成されたときにlastActivityを設定
export const setRoomLastActivityOnCreate = onDocumentCreated({
  region: region,
  document: "rooms/{roomId}",
}, async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  const room = event.data?.data();
  if (!room) {
    logger.error("No room data found");
    return;
  }

  const roomRef = event.data?.ref;
  try {
    await roomRef?.update({
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info(`Set lastActivity for new room ${event.params.roomId}`);
  } catch (error) {
    logger.error("Error setting room lastActivity:", error);
  }
});

// メッセージが作成されたときにルームの最終アクティビティ時刻を更新
export const updateRoomLastActivityOnMessage = onDocumentCreated({
  region: region,
  document: "rooms/{roomId}/messages/{messageId}",
}, async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  const message = event.data?.data();
  if (!message) {
    logger.error("No message data found");
    return;
  }

  const roomId = event.params.roomId;
  await updateLastActivity(roomId);
});

// 参加者が入室したときにルームの最終アクティビティ時刻を更新
export const updateRoomLastActivityOnJoin = onDocumentCreated({
  region: region,
  document: "rooms/{roomId}/participants/{userId}",
}, async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  const participant = event.data?.data();
  if (!participant) {
    logger.error("No participant data found");
    return;
  }

  const roomId = event.params.roomId;
  await updateLastActivity(roomId);
});

// 24時間ごとに古いルームをチェックして削除
export const cleanupInactiveRooms = onSchedule({
  schedule: "0 0 * * *", // 毎日午前0時に実行
  timeoutSeconds: 540, // 9分のタイムアウト
  region: region,
}, async () => {
  const firestore = admin.firestore();
  const INACTIVE_THRESHOLD_MINUTES = 4320; // 非アクティブと判断する時間（3日 = 72時間 = 4320分）

  try {
    // 現在時刻からINACTIVE_THRESHOLD_MINUTES前の時刻を計算
    const thresholdDate = new Date();
    thresholdDate.setMinutes(thresholdDate.getMinutes() - INACTIVE_THRESHOLD_MINUTES);

    // 最終アクティビティが閾値より古いルームを検索
    const snapshot = await firestore.collection("rooms")
      .where("lastActivity", "<", thresholdDate)
      .get();

    logger.info(`Found ${snapshot.size} inactive rooms to delete`);

    // 古いルームとそのサブコレクションを削除
    for (const doc of snapshot.docs) {
      const roomRef = doc.ref;
      
      // messagesサブコレクションを削除
      const messages = await roomRef.collection("messages").get();
      for (const msg of messages.docs) {
        await msg.ref.delete();
      }

      // participantsサブコレクションを削除
      const participants = await roomRef.collection("participants").get();
      for (const participant of participants.docs) {
        await participant.ref.delete();
      }

      // ルーム自体を削除
      await roomRef.delete();
    }
    logger.info(`Successfully deleted ${snapshot.size} inactive rooms`);
  } catch (error) {
    logger.error("Error cleaning up inactive rooms:", error);
    throw error;
  }
});
