import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, Role } from '../store/authStore';
import { Shield, Lock, Mail, ArrowRight, CheckCircle, Building2, UserCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@numm.gov.in');
  const [password, setPassword] = useState('Admin@1234');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid credentials. Please verify email and password.');
    }
  };

  const handleQuickFill = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-900 text-slate-100 relative overflow-hidden">
      {/* Background GovTech Grid & Aura */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-amber-500/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Tricolor Ribbon */}
      <div className="h-1.5 flex w-full relative z-10">
        <div className="bg-[#FF9933] flex-1" />
        <div className="bg-white flex-1" />
        <div className="bg-[#138808] flex-1" />
      </div>

      {/* Header */}
      <div className="py-6 px-8 flex items-center justify-between relative z-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-mono font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white font-mono tracking-tight">NUMM</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                GOVERNMENT OF INDIA
              </span>
            </div>
            <p className="text-xs text-slate-400">One Nation – One Material Code Initiative</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Department of Public Enterprises</span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">National Master Sign-in</h2>
            <p className="text-xs text-slate-400 mt-1">
              Secure access for Central Public Sector Enterprises (CPSEs)
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cpse.gov.in"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating with NUMM...</span>
              ) : (
                <>
                  <span>Authenticate & Enter Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick Sign-in Credentials
            </p>
            <div className="grid grid-cols-1 gap-2">
              <div
                onClick={() => handleQuickFill('admin@numm.gov.in', 'Admin@1234')}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-amber-400 block">SUPER_ADMIN</span>
                  <span className="text-slate-400 text-[11px]">admin@numm.gov.in (Pass: Admin@1234)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Click to fill</span>
              </div>

              <div
                onClick={() => handleQuickFill('analyst@ongc.in', 'Analyst@1234')}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-blue-400 block">CPSE_ANALYST (ONGC)</span>
                  <span className="text-slate-400 text-[11px]">analyst@ongc.in (Pass: Analyst@1234)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Click to fill</span>
              </div>

              <div
                onClick={() => handleQuickFill('reviewer@numm.gov.in', 'Review@1234')}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-emerald-400 block">REVIEWER</span>
                  <span className="text-slate-400 text-[11px]">reviewer@numm.gov.in (Pass: Review@1234)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Click to fill</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-slate-500 font-mono relative z-10 border-t border-slate-900">
        CPSEs Onboarded: ONGC • BHEL • SAIL • GAIL • IOCL • NTPC • NMDC • HAL • BEL • CONCOR
      </div>
    </div>
  );
};
