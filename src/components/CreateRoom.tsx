import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogOut, User } from "lucide-react";
import { collection, addDoc, serverTimestamp, getDoc, doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface RecentRoom {
  id: string;
  name: string;
}

const CreateRoom: React.FC = () => {
  const [roomName, setRoomName] = useState('');
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedRecentRooms = localStorage.getItem('recentRooms');
    if (storedRecentRooms) {
      setRecentRooms(JSON.parse(storedRecentRooms));
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUsername(userData.username);
          } else {
            console.error('ユーザードキュメントが見つかりません');
            navigate('/login');
          }
        } catch (error) {
          console.error('ユーザー情報の取得に失敗しました:', error);
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (!username) {
    return <div>Loading...</div>;
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !auth.currentUser) return;

    try {
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
    <div className="min-h-screen bg-[#FFF8E1] p-4">
      <div className="container mx-auto max-w-md">
        <div className="flex justify-between items-center mb-6 bg-[#4CAF50] text-white p-4 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold">どうぶつチャット</h1>
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4" />
            <span>{username}</span>
          </div>
        </div>
        
        <Card className="mb-6 bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-[#4CAF50]">最近のルーム</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentRooms.map((room) => (
                <li key={room.id} className="bg-[#E8F5E9] p-2 rounded">
                  <Link 
                    to={`/chat/${room.id}`} 
                    className="block text-center hover:bg-[#C8E6C9] transition-colors text-[#2E7D32]"
                  >
                    {room.name}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="mb-6 bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-[#4CAF50]">新しいルームを作成</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="例: キリンの部屋"
                className="border-[#4CAF50] focus:ring-[#4CAF50]"
              />
              <Button 
                onClick={handleCreateRoom}
                className="w-full bg-[#4CAF50] text-white hover:bg-[#45a049]"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> ルームを作成
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Button
          variant="outline"
          className="w-full border-[#4CAF50] text-[#4CAF50] hover:bg-[#E8F5E9]"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" /> ログアウト
        </Button>
      </div>
    </div>
  );
};

export default CreateRoom;