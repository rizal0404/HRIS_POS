
import React from 'react';
import { UserProfile } from '../types';
import { LogOutIcon } from './Icons';

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-slate-800">
            HR Dashboard
          </h1>
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-slate-600 hidden sm:block">
                Welcome, <span className="font-semibold">{user.name}</span>
              </span>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
                aria-label="Logout"
              >
                <LogOutIcon className="w-5 h-5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;