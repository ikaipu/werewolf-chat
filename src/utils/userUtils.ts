import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const fetchUserData = async () => {
  if (!auth.currentUser) return null;
  const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
  if (userDoc.exists()) {
    return userDoc.data().username || 'Anonymous';
  }
  return auth.currentUser.displayName || 'Anonymous';
};