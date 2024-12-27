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
  currentRoomId: string | null
) => {
  const [roomName, setRoomName] = useState("Loading...");
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  useEffect(() => {
    console.log("useRoomData useEffect triggered", { roomId, userId, currentRoomId });
    if (!userId) {
      console.log("No userId, redirecting to login");
      navigate('/login');
      return;
    }

    if (!roomId) {
      console.log("No roomId", { currentRoomId });
      if (currentRoomId) {
        console.log("Redirecting to current room", currentRoomId);
        navigate(`/chat/${currentRoomId}`);
      } else {
        console.log("Redirecting to home");
        navigate('/');
      }
      return;
    }

    const fetchRoomData = async () => {
      try {
        console.log("Fetching room data for", roomId);
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));
        if (!roomDoc.exists()) {
          console.log("Room does not exist, redirecting to home");
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

        const isParticipant = participantsData.some(p => p.id === userId);
        console.log("Is user a participant?", isParticipant);
        if (!isParticipant) {
          console.log("User is not a participant, showing join dialog");
          setShowJoinDialog(true);
        } else {
          console.log("User is a participant, setting current room id");
          setCurrentRoomId(roomId);
        }
      } catch (error) {
        console.error("Error fetching room data: ", error);
        setCurrentRoomId(null);
        navigate('/');
      }
    };

    fetchRoomData();
  }, [roomId, navigate, userId, setCurrentRoomId, currentRoomId]);

  return { roomName, showJoinDialog, setShowJoinDialog };
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
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { userData, isLoading } = useUser();
  const { userId, currentRoomId, setCurrentRoomId } = useStore();
  const [newMessage, setNewMessage] = useState("");
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const { roomName, showJoinDialog, setShowJoinDialog } = useRoomData(roomId ?? undefined, userId ?? undefined, navigate, setCurrentRoomId, currentRoomId);
  const { participants, isParticipant } = useParticipants(roomId ?? undefined, userId ?? undefined);
  const { messages, setMessages } = useMessages(roomId, isParticipant);

  useEffect(() => {
    if (isParticipant === false) {
      setShowJoinDialog(true);
    }
  }, [isParticipant, setShowJoinDialog]);

  console.log("ChatRoom rendered", { roomId, userId, currentRoomId, isLoading, isParticipant });

  const handleJoinRoom = async () => {
    console.log("Joining room", { userData, roomId, userId });
    if (!userData || !roomId || !userId) return;

    try {
      // 参加者として登録
      await setDoc(doc(db, 'rooms', roomId, 'participants', userId), {
        id: userId,
        name: userData.username,
        isHost: false
      });
      console.log("Successfully joined room");

      // 参加者リストを即座に更新
      const participantsRef = collection(db, 'rooms', roomId, 'participants');
      const participantsSnapshot = await getDocs(participantsRef);
      const newParticipants = participantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Participant));
      
      // 参加確認
      const isNewParticipant = newParticipants.some(p => p.id === userId);
      if (isNewParticipant) {
        // メッセージを即座に取得して表示
        const messagesRef = collection(db, 'rooms', roomId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const messagesSnapshot = await getDocs(q);
        const newMessages = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));
        setMessages(newMessages);
        
        setCurrentRoomId(roomId);
        setShowJoinDialog(false);
      }
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
      console.error("メッセージ送信中にエラーが発生しました: ", error);
    }
  };

  const handleMassExit = async () => {
    if (!roomId || !userId) return;

    try {
      await massExit(roomId);
      navigate('/');
    } catch (error) {
      console.error("一斉退出中にエラーが発生しました: ", error);
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

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
    }
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return '';
  };

  if (isLoading || isParticipant === null) {
    console.log("Still loading data");
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyRoomId} 
                    className="bg-white text-[#4CAF50] hover:bg-[#E8F5E9] relative"
                  >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    {showCopyFeedback ? "コピーしました！" : "ルームID"}
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
                    {participant.isHost}
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
