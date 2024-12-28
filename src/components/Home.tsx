import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { createRoom } from '../utils/roomUtils';
import { useStore } from '../store/useStore';
import { useUser } from '../hooks/useUser';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { PlusCircle, LogOut, User, DoorOpen } from "lucide-react";

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomError, setRoomError] = useState('');
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
      const newRoomId = await createRoom(roomName, userData.username);
      // ルーム作成後、currentRoomIdを設定してから遷移
      const store = useStore.getState();
      store.setCurrentRoomId(newRoomId);
      navigate(`/chat/${newRoomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
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
      setVerificationError(t('home.emailVerification.error'));
      console.error('Email verification error:', error);
    }
  };

  if (isLoading) {
    return <div>{t('home.loading')}</div>;
  }

  if (auth.currentUser && !auth.currentUser.emailVerified) {
    return (
      <div className="min-h-screen bg-[#FFF8E1] p-4">
        <div className="container mx-auto max-w-md">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-[#4CAF50]">{t('home.emailVerification.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                {t('home.emailVerification.message')}
              </p>
              {verificationError && (
                <p className="text-red-500">{verificationError}</p>
              )}
              {verificationSent ? (
                <p className="text-green-600">
                  {t('home.emailVerification.sent')}
                </p>
              ) : (
                <Button
                  onClick={handleResendVerification}
                  className="w-full bg-[#4CAF50] text-white hover:bg-[#45a049]"
                >
                  {t('home.emailVerification.resend')}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full border-[#4CAF50] text-[#4CAF50] hover:bg-[#E8F5E9]"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" /> {t('home.logout')}
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
          <h1 className="text-2xl font-bold">{t('home.title')}</h1>
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4" />
            <span>{userData?.username || 'Anonymous'}</span>
          </div>
        </div>
        
        {lastAccessedRoom && (
          <Card className="mb-6 bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-[#4CAF50]">{t('home.lastRoom')}</CardTitle>
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
              <CardTitle className="text-[#4CAF50]">{t('home.createNewRoom')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <Input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder={t('home.roomNamePlaceholder')}
                  className="border-[#4CAF50] focus:ring-[#4CAF50]"
                />
                <Button 
                  type="submit"
                  className="w-full bg-[#4CAF50] text-white hover:bg-[#45a049]"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> {t('home.createRoom')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-[#4CAF50]">{t('home.joinRoomTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setRoomError('');
                if (!roomId.trim()) {
                  setRoomError(t('home.roomIdRequired'));
                  return;
                }
                try {
                  const trimmedRoomId = roomId.trim();
                  const roomRef = doc(db, 'rooms', trimmedRoomId);
                  const roomDoc = await getDoc(roomRef);
                  if (!roomDoc.exists()) {
                    setRoomError(t('home.roomNotFound'));
                    return;
                  }
                  // ルームが存在する場合、currentRoomIdを設定してから遷移
                  const store = useStore.getState();
                  store.setCurrentRoomId(trimmedRoomId);
                  navigate(`/chat/${trimmedRoomId}`);
                } catch (error) {
                  console.error('Error joining room:', error);
                  setRoomError(t('home.roomNotFound'));
                }
              }} className="space-y-4">
                <Input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder={t('home.enterRoomId')}
                  className="border-[#4CAF50] focus:ring-[#4CAF50]"
                />
                {roomError && (
                  <p className="text-red-500 text-sm">{roomError}</p>
                )}
                <Button 
                  type="submit"
                  className="w-full bg-[#4CAF50] text-white hover:bg-[#45a049]"
                >
                  <DoorOpen className="mr-2 h-4 w-4" /> {t('home.joinRoom')}
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
          <LogOut className="mr-2 h-4 w-4" /> {t('home.logout')}
        </Button>
      </div>
    </div>
  );
};

export default Home;
