import React, { useState } from 'react';
import { createUserWithEmailAndPassword, AuthError, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AuthLayout from './AuthLayout';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
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

      setSuccess(true);
    } catch (err) {
      const authError = err as AuthError;
      setError(`サインアップに失敗しました: ${authError.code} - ${authError.message}`);
      console.error('サインアップエラー:', authError);
    }
  };

  return (
    <AuthLayout title="新しい仲間になる">
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {success && (
        <p className="text-green-500 mb-4 text-center">
          サインアップが完了しました。ログインページに移動します...
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
            placeholder="例：はなこ"
            required
          />
        </div>
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
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">パスワード（確認）</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#4CAF50] text-white py-2 px-4 rounded-md hover:bg-[#45a049] transition duration-300 flex items-center justify-center"
          disabled={success}
        >
          <UserPlus className="mr-2" size={18} />
          新規登録
        </button>
      </form>
      <p className="mt-4 text-sm text-center text-gray-600">
        すでにアカウントをお持ちの方は
        <Link to="/login" className="text-[#4CAF50] hover:underline">こちら</Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;