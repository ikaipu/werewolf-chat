import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc, Timestamp, addDoc, serverTimestamp, getDocs, setDoc } from 'firebase/firestore';
import { useUser } from '../hooks/useUser';
import { massExit, leaveRoom } from '../utils/roomUtils';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Send, Link as LinkIcon, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { NavigateFunction } from 'react-router-dom';

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
}

interface Message {
  id: string;
  sender: string;
  senderName: string;
  content: string;
  timestamp: Timestamp;
}

const useRoomData = (
  roomId: string | undefined,
  userId: string | undefined,
  navigate: NavigateFunction,
  setCurrentRoomId: (roomId: string | null) => void,
  currentRoomId: string | null,
  t: (key: string) => string
) => {
  const [roomName, setRoomName] = useState(t('common.loading'));
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    if (!roomId) {
      setError(t('chat.noRoomId'));
      setTimeout(() => {
        if (currentRoomId) {
          navigate(`/chat/${currentRoomId}`);
        } else {
          navigate('/');
        }
      }, 2000);
      return;
    }

    const fetchRoomData = async () => {
      try {
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));
        if (!roomDoc.exists()) {
          setError(t('chat.roomNotFound'));
          setCurrentRoomId(null);
          setTimeout(() => {
            navigate('/');
          }, 2000);
          return;
        }

        const roomData = roomDoc.data();
        setRoomName(roomData.name);
        setCurrentRoomId(roomId);

        const participantsSnapshot = await getDocs(collection(db, 'rooms', roomId, 'participants'));
        const participantsData = participantsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Participant));

        const isParticipant = participantsData.some(p => p.id === userId);
        if (!isParticipant) {
          setShowJoinDialog(true);
        }
      } catch (error) {
        console.error("Error fetching room data: ", error);
        setCurrentRoomId(null);
        navigate('/');
      }
    };

    fetchRoomData();
  }, [roomId, navigate, userId, setCurrentRoomId, currentRoomId, t]);

  return { roomName, showJoinDialog, setShowJoinDialog, error };
};

const useMessages = (roomId: string | undefined, isParticipant: boolean | null) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!roomId || !isParticipant) return;

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(newMessages);
    });

    return () => {
      unsubscribeMessages();
    };
  }, [roomId, isParticipant]);

  return { messages, setMessages };
};

const useParticipants = (
  roomId: string | undefined,
  userId: string | undefined
) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isParticipant, setIsParticipant] = useState<boolean | null>(null);

  useEffect(() => {
    if (!roomId || !userId) return;

    const participantsRef = collection(db, 'rooms', roomId, 'participants');
    const unsubscribeParticipants = onSnapshot(participantsRef, (snapshot) => {
      const newParticipants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Participant));
      setParticipants(newParticipants);
      setIsParticipant(newParticipants.some(p => p.id === userId));
    });

    return () => {
      unsubscribeParticipants();
    };
  }, [roomId, userId]);

  return { participants, isParticipant };
};

const ChatRoom: React.FC = () => {
  const { t } = useTranslation();
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { userData, isLoading } = useUser();
  const { userId, currentRoomId, setCurrentRoomId } = useStore();
  const [newMessage, setNewMessage] = useState("");
  const [toast, setToast] = useState<{message: string, visible: boolean}>({ message: '', visible: false });
  const { roomName, showJoinDialog, setShowJoinDialog, error } = useRoomData(roomId ?? undefined, userId ?? undefined, navigate, setCurrentRoomId, currentRoomId, t);
  const { participants, isParticipant } = useParticipants(roomId ?? undefined, userId ?? undefined);
  const { messages, setMessages } = useMessages(roomId, isParticipant);

  useEffect(() => {
    if (isParticipant === false) {
      setShowJoinDialog(true);
    }
  }, [isParticipant, setShowJoinDialog]);

  const handleJoinRoom = async () => {
    if (!userData || !roomId || !userId) return;

    try {
      await setDoc(doc(db, 'rooms', roomId, 'participants', userId), {
        id: userId,
        name: userData.username,
        isHost: false
      });

      const messagesRef = collection(db, 'rooms', roomId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      const messagesSnapshot = await getDocs(q);
      const newMessages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(newMessages);
      
      setShowJoinDialog(false);
    } catch (error) {
      console.error("Error joining room: ", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !roomId || !userData) return;

    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        content: newMessage,
        sender: userId,
        senderName: userData.username,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  const handleMassExit = async () => {
    if (!roomId || !userId) return;

    try {
      await massExit(roomId);
      navigate('/');
    } catch (error) {
      console.error("Error during mass exit: ", error);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !userId) return;

    try {
      await leaveRoom(roomId);
      setCurrentRoomId(null);
      navigate('/');
    } catch (error) {
      console.error("Error leaving room: ", error);
    }
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2000);
  };

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      showToast(t('chat.copied.roomId'));
    }
  };

  const copyRoomUrl = () => {
    if (roomId) {
      const url = `${window.location.origin}/chat/${roomId}`;
      navigator.clipboard.writeText(url);
      showToast(t('chat.copied.url'));
    }
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return '';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFF8E1] p-4 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-red-500">{t('chat.error')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">{error}</p>
            <p className="text-center text-sm text-gray-500 mt-2">
              {t('chat.returningToHome')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || isParticipant === null) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-[#FFF8E1] p-2 sm:p-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="bg-white shadow-md flex flex-col h-[calc(100vh-1rem)]">
            <CardHeader className="bg-[#4CAF50] text-white p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2">
                <CardTitle className="text-lg mb-2 sm:mb-0">{t('chat.room')}: {roomName}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyRoomId} 
                      className="bg-white text-[#4CAF50] hover:bg-[#E8F5E9] relative"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      {t('chat.roomId')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyRoomUrl} 
                      className="bg-white text-[#4CAF50] hover:bg-[#E8F5E9] relative"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      {t('chat.url')}
                    </Button>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleLeaveRoom} className="bg-red-500 hover:bg-red-600">
                    <LogOut className="h-4 w-4 mr-1" />
                    {t('chat.exit')}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleMassExit} className="bg-red-500 hover:bg-red-600">
                    <LogOut className="h-4 w-4 mr-1" />
                    {t('chat.exitAll')}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {participants.map((participant, index) => (
                  <Badge 
                    key={index} 
                    variant={participant.id === userId ? "default" : "secondary"} 
                    className="text-xs bg-[#E8F5E9] text-[#4CAF50]"
                  >
                    {participant.name}
                    {participant.isHost}
                    {participant.id === userId && t('chat.you')}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col p-2 overflow-hidden">
              <ScrollArea className="flex-grow">
                {messages.map((msg) => (
                  <div key={msg.id} className={`mb-2 ${msg.sender === userId ? 'ml-auto' : 'mr-auto'}`}>
                    <div className={`flex flex-col ${msg.sender === userId ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-[#4CAF50]">{msg.senderName}</span>
                      <div className={`p-2 rounded-lg max-w-[80%] ${msg.sender === userId ? 'bg-[#4CAF50] text-white' : 'bg-[#E8F5E9] text-[#2E7D32]'}`}>
                        <p className="text-sm break-words">{msg.content}</p>
                      </div>
                      <span className="text-xs text-gray-400">{formatTimestamp(msg.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-2">
              <div className="flex w-full items-center space-x-2">
                <Input
                  type="text"
                  placeholder={t('chat.messagePlaceholder')}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-grow border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]"
                />
                <Button type="submit" onClick={sendMessage} className="bg-[#4CAF50] text-white hover:bg-[#45a049] px-3 py-2">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="bg-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('chat.joinRoom')}</DialogTitle>
            <DialogDescription>
              {t('chat.joinRoomConfirm')} "{roomName}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate('/')}>
              {t('chat.cancel')}
            </Button>
            <Button onClick={handleJoinRoom}>
              {t('chat.join')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {toast.visible && (
        <div className="fixed top-4 right-4 bg-white text-[#4CAF50] px-4 py-2 rounded-lg shadow-lg animate-fade-in-down border border-[#4CAF50] z-[100]">
          {toast.message}
        </div>
      )}
    </>
  );
};

export default ChatRoom;
