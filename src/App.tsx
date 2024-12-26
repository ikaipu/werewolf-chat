import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import ChatRoom from './components/ChatRoom';
import PasswordReset from './components/PasswordReset';
import { useStore } from './store/useStore';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setUserId } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUserId(currentUser ? currentUser.uid : null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUserId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        <Route path="/chat/:roomId" element={user ? <ChatRoom /> : <Navigate to="/login" />} />
        <Route path="/password-reset" element={!user ? <PasswordReset /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
