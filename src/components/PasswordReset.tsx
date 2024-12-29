import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthLayout } from './AuthLayout';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ErrorMessage } from './ErrorMessage';
import { validateEmail } from '../utils/validation';

const PasswordReset: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateEmail(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      setError(t('auth.resetEmailError'));
      console.error('Password reset error:', err);
    }
  };

  return (
    <AuthLayout title={t('auth.resetPassword')}>
      <ErrorMessage message={error} />
      {success ? (
        <div className="text-center space-y-4">
          <p className="text-green-600">
            {t('auth.resetEmailSent')}
          </p>
          <p className="text-sm text-gray-600">
            {t('auth.resetEmailInstructions')}
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-[#4CAF50] text-white py-2 px-4 rounded-md hover:bg-[#45a049] transition duration-300"
          >
            {t('auth.backToLogin')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.registeredEmail')}
              </label>
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
              {t('auth.sendResetEmail')}
            </Button>
          </form>
          <Button
            onClick={() => navigate('/login')}
            variant="outline"
            className="w-full"
          >
            {t('auth.backToLogin')}
          </Button>
        </div>
      )}
    </AuthLayout>
  );
};

export default PasswordReset;
