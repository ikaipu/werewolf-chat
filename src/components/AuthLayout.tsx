import React, { ReactNode } from 'react';
import mainLogo from '../assets/main-logo.svg';
import backgroundSvg from '../assets/background.svg';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-[#FFF8E1] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <img src={backgroundSvg} alt="背景" className="absolute inset-0 w-full h-full object-cover" />
      
      <div className="w-full max-w-md bg-white bg-opacity-90 rounded-lg shadow-md p-8 relative z-10">
        <div className="flex justify-center mb-8">
          <img src={mainLogo} alt="どうぶつチャットロゴ" className="w-30 h-30" />
        </div>
        <h1 className="text-3xl font-bold text-center text-[#4CAF50] mb-6">{title}</h1>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;