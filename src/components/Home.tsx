import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createRoom } from '../utils/roomUtils';
import { useStore } from '../store/useStore';
import { useUser } from '../hooks/useUser';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogOut, User, DoorOpen } from "lucide-react";

const Home: React.FC = () => {
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const { userId } = useStore();
  const { userData, isLoading } = useUser();
  const navigate = useNavigate();
  const { lastAccessedRoomId } = useStore();
  const [lastAccessedRoom, setLastAccessedRoom] = useState<{ id: string; name: string } | null>(null);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

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

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationSent(true);
      setVerificationError('');
    } catch (error) {
      setVerificationError('メールの再送信に失敗しました。しばらく待ってから再試行してください。');
      console.error('Email verification error:', error);
    }
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (auth.currentUser && !auth.currentUser.emailVerified) {
    return (
      <div className="min-h-screen bg-[#FFF8E1] p-4">
        <div className="container mx-auto max-w-md">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-[#4CAF50]">メール確認が必要です</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                メールアドレスの確認が完了していません。
                確認メールのリンクをクリックして、メールアドレスの確認を完了してください。
              </p>
              {verificationError && (
                <p className="text-red-500">{verificationError}</p>
              )}
              {verificationSent ? (
                <p className="text-green-600">
                  確認メールを送信しました。メールをご確認ください。
                </p>
              ) : (
                <Button
                  onClick={handleResendVerification}
                  className="w-full bg-[#4CAF50] text-white hover:bg-[#45a049]"
                >
                  確認メールを再送信
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full border-[#4CAF50] text-[#4CAF50] hover:bg-[#E8F5E9]"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" /> ログアウト
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
        
        <div className="space-y-6 mb-6">
          <Card className="bg-white shadow-md">
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

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-[#4CAF50]">ルームに参加</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (roomId.trim()) {
                  navigate(`/chat/${roomId.trim()}`);
                }
              }} className="space-y-4">
                <Input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="ルームIDを入力"
                  className="border-[#4CAF50] focus:ring-[#4CAF50]"
                />
                <Button 
                  type="submit"
                  className="w-full bg-[#4CAF50] text-white hover:bg-[#45a049]"
                >
                  <DoorOpen className="mr-2 h-4 w-4" /> ルームに参加
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
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
