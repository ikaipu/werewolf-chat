import React, { useState } from 'react';
import { createUserWithEmailAndPassword, AuthError, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: username });
      
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        username: username,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      navigate('/');
    } catch (err) {
      const authError = err as AuthError;
      setError(`サインアップに失敗しました: ${authError.code} - ${authError.message}`);
      console.error('Signup error:', authError);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8E1] p-4">
      <div className="container mx-auto max-w-md">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#4CAF50]">どうぶつチャット サインアップ</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block mb-2 text-[#4CAF50]">メールアドレス</label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#4CAF50] focus:ring-[#4CAF50]"
                  required
                />
              </div>
              <div>
                <label htmlFor="username" className="block mb-2 text-[#4CAF50]">ユーザー名</label>
                <Input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-[#4CAF50] focus:ring-[#4CAF50]"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block mb-2 text-[#4CAF50]">パスワード</label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[#4CAF50] focus:ring-[#4CAF50]"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block mb-2 text-[#4CAF50]">パスワード（確認）</label>
                <Input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-[#4CAF50] focus:ring-[#4CAF50]"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#4CAF50] text-white hover:bg-[#45a049]">
                サインアップ
              </Button>
            </form>
            <p className="mt-4 text-center text-[#4CAF50]">
              すでにアカウントをお持ちの方は
              <Link to="/login" className="text-[#2E7D32] hover:underline">
                こちらからログイン
              </Link>
              してください。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;