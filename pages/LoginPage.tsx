import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { UserProfile } from '../types';
import { Logo } from '../components/Logo';
import { LoginIllustration } from '../components/LoginIllustration';
import Modal from '../components/Modal';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

const ForgotPasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [resetEmail, setResetEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await apiService.sendPasswordResetEmail(resetEmail);
      setMessage('Jika email Anda terdaftar, Anda akan menerima link untuk mereset kata sandi.');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // To prevent email enumeration, show a generic message
        setMessage('Jika email Anda terdaftar, Anda akan menerima link untuk mereset kata sandi.');
      } else {
        setError('Gagal mengirim permintaan. Silakan coba lagi nanti.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lupa Kata Sandi">
      <form onSubmit={handleResetRequest} className="space-y-4">
        <p className="text-sm text-slate-600">
          Masukkan alamat email Anda. Kami akan mengirimkan instruksi untuk mereset kata sandi Anda. Permintaan ini akan diteruskan ke SuperAdmin.
        </p>
        <div>
          <label htmlFor="reset-email" className="sr-only">
            Email address
          </label>
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none relative block w-full px-4 py-3 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 sm:text-sm"
            placeholder="Email address"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
        </div>

        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
            <button
                type="button"
                onClick={onClose}
                className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
                Batal
            </button>
            <button
                type="submit"
                disabled={isLoading}
                className="bg-black py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-400"
            >
                {isLoading ? 'Mengirim...' : 'Kirim Permintaan'}
            </button>
        </div>
      </form>
    </Modal>
  );
};


const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await apiService.login(email, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        setError('Email atau kata sandi salah. Silakan coba lagi.');
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi nanti.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="flex w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Left Side: Illustration */}
        <div className="hidden md:block w-1/2 bg-slate-50">
           <LoginIllustration />
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            <Logo variant="login" className="mb-8" />
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  className="appearance-none relative block w-full px-4 py-3 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 sm:text-sm"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-600 text-center">{error}</p>}

              <div className="flex items-center justify-between text-sm">
                <label htmlFor="stay-signed-in" className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input id="stay-signed-in" type="checkbox" className="h-4 w-4 text-red-600 border-slate-300 rounded focus:ring-red-500" />
                  Tetap masuk
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="font-medium text-slate-600 hover:text-red-500"
                >
                  Lupa kata sandi?
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-black hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800 disabled:bg-slate-400 transition-colors"
                >
                  {isLoading ? 'Masuk...' : 'Masuk'}
                </button>
              </div>
               <div>
                <button
                  type="button"
                  disabled
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-slate-500 bg-slate-200 cursor-not-allowed"
                >
                  Pasang SIMP
                </button>
              </div>
            </form>
            <p className="mt-8 text-center text-xs text-slate-400">Copyright © SIG 2025</p>
          </div>
        </div>
      </div>
      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />
    </div>
  );
};

export default LoginPage;