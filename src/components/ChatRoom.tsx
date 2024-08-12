import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc, Timestamp, addDoc, serverTimestamp, getDocs, setDoc } from 'firebase/firestore';
import { useUser } from '../hooks/useUser';
import { massExit, leaveRoom } from '../utils/roomUtils';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Link as LinkIcon, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
}

interface Message {
  id: string;
  sender: string;
  senderName: string; // この行を追加
  content: string;
  timestamp: Timestamp;
}

const ChatRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("Loading...");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { userData, isLoading } = useUser();
  const { userId, currentRoomId, setCurrentRoomId, setLastAccessedRoomId } = useStore();
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  useEffect(() => {
    if (roomId) {
      setLastAccessedRoomId(roomId);
    }
  }, [roomId, setLastAccessedRoomId]);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    if (!roomId) {
      if (currentRoomId) {
        navigate(`/chat/${currentRoomId}`);
      } else {
        navigate('/');
      }
      return;
    }

    const fetchRoomData = async () => {
      try {
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));
        if (!roomDoc.exists()) {
          setCurrentRoomId(null);
          navigate('/');
          return;
        }

        setRoomName(roomDoc.data().name);

        const participantsSnapshot = await getDocs(collection(db, 'rooms', roomId, 'participants'));
        const participantsData = participantsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Participant));

        setParticipants(participantsData);

        const isParticipant = participantsData.some(p => p.id === userId);
        if (!isParticipant) {
          setShowJoinDialog(true);
        } else {
          setCurrentRoomId(roomId);
          setupListeners();
        }
      } catch (error) {
        console.error("ルームデータの取得中にエラーが発生しました: ", error);
        setCurrentRoomId(null);
        navigate('/');
      }
    };

    fetchRoomData();
  }, [roomId, navigate, userId, setCurrentRoomId, currentRoomId]);

  const handleJoinRoom = async () => {
    if (!userData || !roomId || !userId) return;

    try {
      await setDoc(doc(db, 'rooms', roomId, 'participants', userId), {
        id: userId,
        name: userData.username,
        isHost: false
      });
      setCurrentRoomId(roomId);
      setupListeners();
      setShowJoinDialog(false);
    } catch (error) {
      console.error("ルーム参加中にエラーが発生しました: ", error);
    }
  };

  const setupListeners = () => {
    if (!roomId) return;

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(newMessages);
    });

    const participantsRef = collection(db, 'rooms', roomId, 'participants');
    const unsubscribeParticipants = onSnapshot(participantsRef, (snapshot) => {
      const newParticipants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Participant));
      setParticipants(newParticipants);

      if (!newParticipants.some(p => p.id === userId)) {
        navigate('/');
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeParticipants();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !roomId || !userData) return;

    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        content: newMessage,
        sender: userId, // ユーザー名ではなくユーザーIDを使用
        senderName: userData.username, // 表示用にユーザー名も保存
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("メッセージ送信中にエラーが発生しました: ", error);
    }
  };

  const handleMassExit = async () => {
    if (!roomId || !userId) return;

    try {
      await massExit(roomId);
      navigate('/');
    } catch (error) {
      console.error("斉退出中にエラーが発生しました: ", error);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !userId) return;

    try {
      await leaveRoom(roomId);
      setCurrentRoomId(null);
      navigate('/');
    } catch (error) {
      console.error("退出中にエラーが発生しました: ", error);
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${roomId}`);
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return '';
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-[#FFF8E1] p-2 sm:p-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="bg-white shadow-md flex flex-col h-[calc(100vh-1rem)]">
            <CardHeader className="bg-[#4CAF50] text-white p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2">
                <CardTitle className="text-lg mb-2 sm:mb-0">ルーム: {roomName}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={copyRoomLink} className="bg-white text-[#4CAF50] hover:bg-[#E8F5E9]">
                    <LinkIcon className="h-4 w-4 mr-1" />
                    URL
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleLeaveRoom} className="bg-red-500 hover:bg-red-600">
                    <LogOut className="h-4 w-4 mr-1" />
                    退出
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleMassExit} className="bg-red-500 hover:bg-red-600">
                    <LogOut className="h-4 w-4 mr-1" />
                    全員退出
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
                    {participant.isHost && "👑"}
                    {participant.id === userId && " (あなた)"}
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
                  placeholder="メッセージを入力..."
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
            <DialogTitle>ルームに参加しますか？</DialogTitle>
            <DialogDescription>
              "{roomName}" ルームに参加しますか？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate('/')}>
              キャンセル
            </Button>
            <Button onClick={handleJoinRoom}>
              参加する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatRoom;