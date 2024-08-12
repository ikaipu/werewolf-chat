import React, { useState } from 'react';
import { createUserWithEmailAndPassword, AuthError, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

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
      
      // ユーザー名を認証オブジェクトに設定
      await updateProfile(user, { displayName: username });
      
      // Firestoreにユーザー情報を保存
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        username: username,
      });

      // ユーザー情報が確実に保存されるまで少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));

      navigate('/');
    } catch (err) {
      const authError = err as AuthError;
      setError(`サインアップに失敗しました: ${authError.code} - ${authError.message}`);
      console.error('Signup error:', authError);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">サインアップ</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2">メールアドレス</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="username" className="block mb-2">ユーザー名</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block mb-2">パスワード</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="confirmPassword" className="block mb-2">パスワード（確認）</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">サインアップ</button>
      </form>
      <p className="mt-4">
        すでにアカウントをお持ちの方は
        <Link to="/login" className="text-blue-500 hover:underline">
          こちらからログイン
        </Link>
        してください。
      </p>
    </div>
  );
};

export default Signup;