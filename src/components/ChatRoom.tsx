import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Link as LinkIcon, LogOut } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
}

interface Message {
  id: string;
  sender: string;
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
  const [currentUsername, setCurrentUsername] = useState<string>('Anonymous');

  useEffect(() => {
    if (!roomId || !auth.currentUser) return;

    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      if (userDoc.exists()) {
        setCurrentUsername(userDoc.data().username || 'Anonymous');
      } else {
        setCurrentUsername(auth.currentUser!.displayName || 'Anonymous');
      }
    };

    const fetchRoomData = async () => {
      const roomDoc = await getDoc(doc(db, 'rooms', roomId));
      if (roomDoc.exists()) {
        setRoomName(roomDoc.data().name);
        const participantsData = roomDoc.data().participants || [];
        setParticipants(participantsData);
      }
    };

    fetchUserData();
    fetchRoomData();

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !auth.currentUser || !roomId) return;

    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        content: newMessage,
        sender: currentUsername,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  const handleLeaveRoom = () => {
    // ルームを退出する処理を実装
    navigate('/');
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${roomId}`);
    // TODO: コピー成功のフィードバックを表示
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return '';
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto">
      <Card className="flex-grow flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" className="p-0" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              ホームに戻る
            </Button>
            <CardTitle className="text-lg">ルーム: {roomName}</CardTitle>
          </div>
          <div className="flex justify-end space-x-1 mb-2">
            <Button variant="outline" size="sm" onClick={copyRoomLink}>
              <LinkIcon className="h-4 w-4 mr-1" />
              URL
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLeaveRoom}>
              <LogOut className="h-4 w-4 mr-1" />
              退出
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {participants.map((participant, index) => (
              <Badge 
                key={index} 
                variant={participant.id === auth.currentUser?.uid ? "default" : "secondary"} 
                className="text-xs"
              >
                {participant.name}
                {participant.isHost && "👑"}
                {participant.id === auth.currentUser?.uid && " (あなた)"}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col p-2">
          <ScrollArea className="flex-grow">
            {messages.map((msg) => (
              <div key={msg.id} className={`mb-2 ${msg.sender === currentUsername ? 'ml-auto' : 'mr-auto'}`}>
                <div className={`flex flex-col ${msg.sender === currentUsername ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-gray-500">{msg.sender}</span>
                  <div className={`p-2 rounded-lg max-w-[80%] ${msg.sender === currentUsername ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                    <p className="text-sm">{msg.content}</p>
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
              className="flex-grow"
            />
            <Button type="submit" onClick={sendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatRoom;