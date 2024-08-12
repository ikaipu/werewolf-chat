import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, LogOut, User } from "lucide-react";
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface RecentRoom {
  id: string;
  name: string;
}

const Home: React.FC = () => {
  const [roomName, setRoomName] = useState('');
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [username, setUsername] = useState<string>('Anonymous');
  const navigate = useNavigate();

  useEffect(() => {
    const storedRecentRooms = localStorage.getItem('recentRooms');
    if (storedRecentRooms) {
      setRecentRooms(JSON.parse(storedRecentRooms));
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUsername(userData.username || 'Anonymous');
          } else {
            console.error('User document does not exist');
            setUsername(user.displayName || 'Anonymous');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUsername(user.displayName || 'Anonymous');
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !auth.currentUser) return;

    try {
      const roomRef = await addDoc(collection(db, 'rooms'), {
        name: roomName,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid,
        participants: [{ id: auth.currentUser.uid, username: username }]
      });

      const newRoom = { id: roomRef.id, name: roomName };
      const updatedRecentRooms = [newRoom, ...recentRooms.filter(room => room.id !== newRoom.id)].slice(0, 5);
      setRecentRooms(updatedRecentRooms);
      localStorage.setItem('recentRooms', JSON.stringify(updatedRecentRooms));

      navigate(`/chat/${roomRef.id}`);
    } catch (error) {
      console.error('ルーム作成中にエラーが発生しました:', error);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">チャットルーム作成</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{username}</span>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>最近のルーム</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recentRooms.map((room) => (
              <li key={room.id} className="bg-gray-100 p-2 rounded">
                <Link 
                  to={`/chat/${room.id}`} 
                  className="block text-center hover:bg-gray-200 transition-colors"
                >
                  {room.name}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>新しいルームを作成</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="例: プロジェクト討論"
            />
            <Button 
              onClick={handleCreateRoom}
              className="w-full bg-gray-700 text-white hover:bg-gray-600"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> ルームを作成
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" /> ログアウト
      </Button>
    </div>
  );
};

export default Home;