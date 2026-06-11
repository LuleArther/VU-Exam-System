import React, { useState } from 'react';
import { EyeOff, Eye, ShieldAlert, KeyRound, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export default function LoginForm() {
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification code flow state
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [demoCode, setDemoCode] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_number: regNo, password: password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login. Please check your credentials.');
      }

      // If student login requires email verification
      if (data.verification_required) {
        setTargetEmail(data.email);
        setDemoCode(data.debug_code || '');
        setShowVerification(true);
        setLoading(false);
        return;
      }

      // If admin direct login
      if (data.role === 'admin') {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('role', 'admin');
        localStorage.setItem('admin_name', data.student_name);
        window.location.href = '/admin/dashboard';
        return;
      }

      // Fallback direct login (e.g. if verification bypassed)
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('student_name', data.student_name);
      localStorage.setItem('student_id', regNo);
      localStorage.setItem('role', 'student');
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/verify-login-code/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_number: regNo, code: verificationCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }

      // Save credentials and redirect
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('student_name', data.student_name);
      localStorage.setItem('student_id', regNo);
      localStorage.setItem('role', 'student');

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <form className="space-y-4" onSubmit={handleVerificationSubmit}>
        <div className="mb-4">
          <div className="w-12 h-12 bg-blue-50 text-[#2c6fb7] rounded-xl flex items-center justify-center mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-slate-800 font-bold text-[18px] tracking-tight">Email Verification</h3>
          <p className="text-slate-500 text-[13px] mt-1">
            We have sent a verification code to your registered school email address <strong className="text-slate-700">{targetEmail}</strong>.
          </p>
        </div>

        {/* Developer Demo Toast */}
        {demoCode && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-[13px] flex items-center justify-between shadow-sm animate-pulse">
            <div>
              <strong>Demo Tip:</strong> Verification code is <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded font-bold">{demoCode}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setVerificationCode(demoCode)}
              className="text-[#2c6fb7] hover:underline font-bold text-xs"
            >
              Autofill
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Code Input */}
        <div>
          <input 
            type="text" 
            placeholder="Enter 6-Digit Code" 
            required
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-center font-bold tracking-widest text-[20px] placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors placeholder:text-sm placeholder:tracking-normal"
          />
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button 
            type="submit" 
            disabled={loading || verificationCode.length !== 6}
            className="w-full py-[12px] px-4 border border-transparent rounded-lg text-[14px] font-bold text-white bg-[#2c6fb7] hover:bg-[#1a5ba0] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
          >
            {loading ? 'Verifying...' : <>Verify and Access <ArrowRight className="w-4 h-4" /></>}
          </button>
          <button 
            type="button"
            onClick={() => {
              setShowVerification(false);
              setVerificationCode('');
              setError('');
            }}
            className="w-full py-[12px] px-4 border border-slate-200 rounded-lg text-[14px] font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleLoginSubmit}>
      <div className="mb-2">
        <h3 className="text-slate-700 font-medium text-[13.5px]">Enter your details to login into VClass</h3>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex gap-2">
          <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reg No / Email Input */}
      <div>
        <input 
          type="text" 
          placeholder="Reg No (e.g. VU-AAA-1234) or Admin Email" 
          required
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
        />
      </div>

      {/* Password Input */}
      <div className="relative">
        <input 
          type={showPassword ? "text" : "password"}
          placeholder="Your password" 
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors pr-12"
        />
        <button 
          type="button" 
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
        >
          {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Remember me */}
      <div className="flex items-center">
        <input 
          id="remember_me" 
          type="checkbox" 
          className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500/50 cursor-pointer accent-white"
        />
        <label htmlFor="remember_me" className="ml-2 block text-[13px] text-slate-500 cursor-pointer font-medium">
          Remember me
        </label>
      </div>

      {/* Sign In Buttons */}
      <div className="pt-2 flex flex-col gap-2.5">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-[12px] px-4 border border-transparent rounded-lg text-[14px] font-bold text-white bg-[#2c6fb7] hover:bg-[#1a5ba0] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
        >
          {loading ? 'Authenticating...' : <>Sign In <KeyRound className="w-4 h-4" /></>}
        </button>
        <a 
          href="/register" 
          className="w-full py-[12px] px-4 border border-slate-200 rounded-lg text-[14px] font-semibold text-slate-700 bg-white hover:bg-slate-50 text-center transition-colors block"
        >
          Register for VClass
        </a>
      </div>

      {/* Forgot password */}
      <div className="flex justify-end pt-1">
        <a href="#" className="text-[12px] font-medium text-slate-400 hover:text-slate-700 transition-colors">
          Forgot password?
        </a>
      </div>
    </form>
  );
}
