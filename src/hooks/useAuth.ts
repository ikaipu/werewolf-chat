import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useStore } from '../store/useStore';

export const useAuth = () => {
  const navigate = useNavigate();
  const { setUserId } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate, setUserId]);
};