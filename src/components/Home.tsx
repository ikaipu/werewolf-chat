import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createRoom } from '../utils/roomUtils';
import { useStore } from '../store/useStore';
import { useUser } from '../hooks/useUser';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogOut, User } from "lucide-react";

interface RecentRoom {
  id: string;
  name: string;
}

const Home: React.FC = () => {
  const [roomName, setRoomName] = useState('');
  const { userId } = useStore();
  const { userData, isLoading } = useUser();
  const navigate = useNavigate();
  const { lastAccessedRoomId } = useStore();
  const [lastAccessedRoom, setLastAccessedRoom] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const fetchLastAccessedRoom = async () => {
      if (lastAccessedRoomId) {
        const roomDoc = await getDoc(doc(db, 'rooms', lastAccessedRoomId));
        if (roomDoc.exists()) {
          setLastAccessedRoom({ id: roomDoc.id, name: roomDoc.data().name });
        }
      }
    };
    fetchLastAccessedRoom();
  }, [lastAccessedRoomId]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !userData?.username || !userId) return;

    try {
      const roomId = await createRoom(roomName, userData.username);
      navigate(`/chat/${roomId}`);
    } catch (error) {
      console.error('ルーム作成中にエラーが発生しました:', error);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FFF8E1] p-4">
      <div className="container mx-auto max-w-md">
        <div className="flex justify-between items-center mb-6 bg-[#4CAF50] text-white p-4 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold">どうぶつチャット</h1>
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4" />
            <span>{userData?.username || 'Anonymous'}</span>
          </div>
        </div>
        
        {lastAccessedRoom && (
          <Card className="mb-6 bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-[#4CAF50]">最後に参加したルーム</CardTitle>
            </CardHeader>
            <CardContent>
              <Link 
                to={`/chat/${lastAccessedRoom.id}`} 
                className="block text-center hover:bg-[#C8E6C9] transition-colors text-[#2E7D32] p-2 rounded"
              >
                {lastAccessedRoom.name}
              </Link>
            </CardContent>
          </Card>
        )}
        
        <Card className="mb-6 bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-[#4CAF50]">新しいルームを作成</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <Input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="例: キリンの部屋"
                className="border-[#4CAF50] focus:ring-[#4CAF50]"
              />
              <Button 
                type="submit"
                className="w-full bg-[#4CAF50] text-white hover:bg-[#45a049]"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> ルームを作成
              </Button>
            </form>
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

export default Home;