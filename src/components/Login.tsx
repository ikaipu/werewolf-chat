import React, { useState } from 'react';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthLayout from './AuthLayout';

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
    <AuthLayout title="どうぶつチャット">
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
            placeholder="example@email.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#4CAF50] text-white py-2 px-4 rounded-md hover:bg-[#45a049] transition duration-300 flex items-center justify-center"
        >
          <LogIn className="mr-2" size={18} />
          ログイン
        </button>
      </form>
      <p className="mt-4 text-sm text-center text-gray-600">
        アカウントをお持ちでない方は
        <Link to="/signup" className="text-[#4CAF50] hover:underline">こちら</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;