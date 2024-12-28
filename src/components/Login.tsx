import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '../firebase';
import { useStore } from '../store/useStore';
import { AuthLayout } from './AuthLayout';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUserId } = useStore();
  const { t } = useTranslation();

  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUserId(userCredential.user.uid);
      navigate(from);
    } catch (err) {
      const authError = err as AuthError;
      setError(`${t('common.error')}: ${authError.code} - ${authError.message}`);
      console.error('Login error:', authError);
    }
  };

  return (
    <AuthLayout title={t('auth.loginTitle')}>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <LogIn className="mr-2" size={18} />
          {t('common.login')}
        </Button>
      </form>
      <div className="mt-4 text-sm text-center space-y-2">
        <p className="text-gray-600">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="text-[#4CAF50] hover:underline">{t('common.signup')}</Link>
        </p>
        <p className="text-gray-600">
          {t('auth.forgotPassword')}{' '}
          <Link to="/password-reset" className="text-[#4CAF50] hover:underline">{t('auth.resetPassword')}</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
