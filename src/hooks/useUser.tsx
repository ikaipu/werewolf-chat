import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useStore } from '../store/useStore';

interface UserData {
  username: string;
  email: string;
}

export const useUser = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userId } = useStore();

  useEffect(() => {
    if (!userId) {
      setUserData(null);
      setIsLoading(false);
      return;
    }

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data() as UserData);
      } else {
        setUserData(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { userData, isLoading };
};