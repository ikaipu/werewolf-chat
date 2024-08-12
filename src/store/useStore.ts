import create from 'zustand';
import { auth } from '../firebase';

interface AppState {
  userId: string | null;
  currentRoomId: string | null;
  lastAccessedRoomId: string | null;
  setUserId: (id: string | null) => void;
  setCurrentRoomId: (id: string | null) => void;
  setLastAccessedRoomId: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  userId: null,
  currentRoomId: null,
  lastAccessedRoomId: null,
  setUserId: (id) => set({ userId: id }),
  setCurrentRoomId: (id) => set({ currentRoomId: id }),
  setLastAccessedRoomId: (id) => set({ lastAccessedRoomId: id }),
}));

// ユーザーの認証状態を監視し、ストアを更新する
auth.onAuthStateChanged((user) => {
  useStore.getState().setUserId(user ? user.uid : null);
});