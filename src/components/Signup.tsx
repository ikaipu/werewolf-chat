import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, AuthError } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useStore } from '../store/useStore';
import { AuthLayout } from './AuthLayout';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const Signup: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();
  const { setUserId } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username: username,
        email: email,
      });
      // メール確認を送信
      await sendEmailVerification(userCredential.user);
      setVerificationSent(true);
      setUserId(userCredential.user.uid);
    } catch (err) {
      const authError = err as AuthError;
      setError(`${t('common.error')}: ${authError.code}`);
      console.error('Signup error:', authError);
    }
  };

  return (
    <AuthLayout title={t('home.title')}>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {verificationSent ? (
        <div className="text-center space-y-4">
          <p className="text-green-600">
            {t('auth.verificationEmailSent')}
          </p>
          <p className="text-sm text-gray-600">
            {t('auth.verificationEmailInstructions')}
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="bg-[#4CAF50] text-white py-2 px-4 rounded-md hover:bg-[#45a049] transition duration-300"
          >
            {t('auth.backToLogin')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">{t('auth.username')}</label>
          <Input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
            placeholder={t('auth.usernamePlaceholder')}
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
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
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">{t('common.password')}</label>
          <Input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
            placeholder="••••••••"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-[#4CAF50] text-white py-2 px-4 rounded-md hover:bg-[#45a049] transition duration-300 flex items-center justify-center"
        >
          <UserPlus className="mr-2" size={18} />
          {t('common.signup')}
        </Button>
        </form>
      )}
      <p className="mt-4 text-sm text-center text-gray-600">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="text-[#4CAF50] hover:underline">{t('common.login')}</Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;
