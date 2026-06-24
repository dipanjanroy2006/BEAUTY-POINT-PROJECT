import React, { useState } from 'react';
import { X, Lock, Mail, User, Eye, EyeOff, Sparkles, Phone } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const referralCode = !isLogin ? (sessionStorage.getItem('referralCode') || undefined) : undefined;
    const body = isLogin 
      ? { email, password } 
      : { username, email, phone, password, referralCode };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setSuccess(isLogin ? 'Welcome back!' : 'Account registered successfully!');
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onClose();
        // Clear forms
        setUsername('');
        setEmail('');
        setPhone('');
        setPassword('');
      }, 800);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        id="auth-modal"
        className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl transition-all border border-neutral-100"
      >
        {/* Aesthetic top decorative bar */}
        <div className="h-2 bg-gradient-to-r from-amber-200 via-rose-300 to-amber-200" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute p-2 transition-colors rounded-full top-4 right-4 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Brand/Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-rose-50 text-rose-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-semibold tracking-wide text-neutral-900">
              {isLogin ? 'Sign In to Beauty Point' : 'Create Your Luxe Account'}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {isLogin ? 'Unlock professional cosmetics recommendations' : 'Join our premium beauty rewards program'}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 mb-4 text-xs font-medium text-red-600 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 mb-4 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg border border-emerald-100">
              {success}
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block mb-1 text-xs font-medium tracking-wide uppercase text-neutral-600">Full Name</label>
                  <div className="relative">
                    <User className="absolute w-4 h-4 text-neutral-400 left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="E.g., Aria Glow"
                      className="w-full py-3.5 pl-10 pr-4 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all text-neutral-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium tracking-wide uppercase text-neutral-600">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute w-4 h-4 text-neutral-400 left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="E.g., +919876543210"
                      className="w-full py-3.5 pl-10 pr-4 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all text-neutral-800"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block mb-1 text-xs font-medium tracking-wide uppercase text-neutral-600">
                {isLogin ? 'Mobile Number or Email' : 'Email Address (Optional)'}
              </label>
              <div className="relative">
                {isLogin ? (
                  <User className="absolute w-4 h-4 text-neutral-400 left-3 top-3.5" />
                ) : (
                  <Mail className="absolute w-4 h-4 text-neutral-400 left-3 top-3.5" />
                )}
                <input
                  type={isLogin ? 'text' : 'email'}
                  required={isLogin}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isLogin ? 'E.g., +919876543210 or admin@beautypoint.com' : 'name@example.com'}
                  className="w-full py-3.5 pl-10 pr-4 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all text-neutral-800"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium tracking-wide uppercase text-neutral-600">Password</label>
              <div className="relative">
                <Lock className="absolute w-4 h-4 text-neutral-400 left-3 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3.5 pl-10 pr-10 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all text-neutral-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute p-1 text-neutral-400 rounded-full right-3 top-3 hover:text-neutral-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-neutral-900 text-white font-medium text-sm rounded-xl hover:bg-neutral-800 focus:ring-2 focus:ring-neutral-900/10 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Toggle Tab */}
          <div className="pt-6 mt-6 border-t border-neutral-100 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors focus:outline-none"
            >
              {isLogin ? "New to Beauty Point? Create an account" : "Already registered? Sign in instead"}
            </button>
          </div>

          {/* Demo Credentials Note */}
          <div className="p-3 mt-4 text-[11px] text-neutral-500 bg-neutral-50 rounded-lg text-left border border-neutral-100 space-y-1">
            <p className="font-semibold text-neutral-700">Quick Testing Accounts:</p>
            <p>• <span className="font-medium text-neutral-600">Admin:</span> admin@beautypoint.com / admin123</p>
            <p>• <span className="font-medium text-neutral-600">Customer:</span> Registered Mobile / password</p>
          </div>
        </div>
      </div>
    </div>
  );
}
