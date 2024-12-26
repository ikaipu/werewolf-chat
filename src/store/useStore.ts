import create from 'zustand';
import { auth } from '../firebase';

interface AppState {
  userId: string | null;
  currentRoomId: string | null;
  lastAccessedRoomId: string | null;
  isEmailVerified: boolean;
  setUserId: (id: string | null) => void;
  setCurrentRoomId: (id: string | null) => void;
  setLastAccessedRoomId: (id: string | null) => void;
  setIsEmailVerified: (verified: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  userId: null,
  currentRoomId: null,
  lastAccessedRoomId: null,
  isEmailVerified: false,
  setUserId: (id) => set({ userId: id }),
  setCurrentRoomId: (id) => set({ currentRoomId: id }),
  setLastAccessedRoomId: (id) => set({ lastAccessedRoomId: id }),
  setIsEmailVerified: (verified) => set({ isEmailVerified: verified }),
}));

// ユーザーの認証状態を監視し、ストアを更新する
auth.onAuthStateChanged((user) => {
  const store = useStore.getState();
  store.setUserId(user ? user.uid : null);
  store.setIsEmailVerified(user ? user.emailVerified : false);
});
