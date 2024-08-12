import React, { useState } from 'react';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      const authError = err as AuthError;
      setError(`ログインに失敗しました: ${authError.code} - ${authError.message}`);
      console.error('Login error:', authError);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8E1] p-4">
      <div className="container mx-auto max-w-md">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#4CAF50]">どうぶつチャット ログイン</CardTitle>
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
              <Button type="submit" className="w-full bg-[#4CAF50] text-white hover:bg-[#45a049]">
                ログイン
              </Button>
            </form>
            <p className="mt-4 text-center text-[#4CAF50]">
              アカウントをお持ちでない方は
              <Link to="/signup" className="text-[#2E7D32] hover:underline">
                こちらからサインアップ
              </Link>
              してください。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;