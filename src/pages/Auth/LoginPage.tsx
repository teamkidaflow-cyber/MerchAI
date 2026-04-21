import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Welcome back');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-ink relative overflow-hidden">
      {/* Subtle gold glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 animate-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-white/[0.06] border border-white/10 rounded-2xl flex items-center justify-center mb-5 shadow-xl">
            <span className="text-xl font-bold text-primary tracking-tighter">AI</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            merch<span className="text-primary">AI</span>
          </h1>
          <p className="text-white/40 mt-2 text-sm font-medium">Shelf intelligence platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.05] border border-white/10 rounded-3xl p-7 backdrop-blur-sm shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={17} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/[0.07] border border-white/10 focus:border-primary/60 text-white placeholder-white/20 rounded-xl py-3.5 pl-11 pr-4 outline-none transition-all duration-200 font-medium text-sm"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={17} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/[0.07] border border-white/10 focus:border-primary/60 text-white placeholder-white/20 rounded-xl py-3.5 pl-11 pr-4 outline-none transition-all duration-200 font-medium text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-light
                         text-ink font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20
                         transition-all duration-200 ease-out active:scale-[0.97]
                         disabled:opacity-50 group mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-ink/40 border-t-ink rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform duration-150" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button className="text-xs font-medium text-white/30 hover:text-primary transition-colors duration-150">
              Forgot password?
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/20 font-medium">
          © 2026 merchAI Africa
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
