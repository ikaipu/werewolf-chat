import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthLayout } from './AuthLayout';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from './ErrorMessage';
import { validateEmail } from '@/utils/validation';

const PasswordReset: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateEmail(email)) {
      setError('有効なメールアドレスを入力してください。');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      setError('パスワードリセットメールの送信に失敗しました。');
      console.error('Password reset error:', err);
    }
  };

  return (
    <AuthLayout title="パスワードリセット">
      <ErrorMessage message={error} />
      {success ? (
        <p className="text-green-600 mb-4">パスワードリセットメールを送信しました。メールをご確認ください。</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
              placeholder="example@email.com"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#4CAF50] text-white py-2 px-4 rounded-md hover:bg-[#45a049] transition duration-300"
          >
            パスワードリセットメールを送信
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default PasswordReset;