import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

export const createRoom = async (roomName: string, username: string) => {
  if (!auth.currentUser) throw new Error('ユーザーが認証されていません');

  const roomRef = await addDoc(collection(db, 'rooms'), {
    name: roomName,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid,
  });

  await setDoc(doc(db, 'rooms', roomRef.id, 'participants', auth.currentUser.uid), {
    id: auth.currentUser.uid,
    name: username,
    isHost: true
  });

  return roomRef.id;
};

export const leaveRoom = async (roomId: string) => {
  if (!auth.currentUser) throw new Error('ユーザーが認証されていません');
  await deleteDoc(doc(db, 'rooms', roomId, 'participants', auth.currentUser.uid));
};

export const massExit = async (roomId: string) => {
  const participantsRef = collection(db, 'rooms', roomId, 'participants');
  const participantsSnapshot = await getDocs(participantsRef);
  const participantDeletePromises = participantsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(participantDeletePromises);
};